import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/service/prisma.service';
import { PublicService } from '../../service/public.service';
import FriendTechConstants from './friend-tech-constants';
import {
  Transaction,
  TransactionReceipt,
  decodeAbiParameters,
  parseAbiParameters,
  slice,
  decodeEventLog,
} from 'viem';
import { getPrice } from './math';
import { TransformedTransaction } from './types';

@Controller('friend-tech')
export class FriendTechController {
  // All tracked user address
  private users: Set<string> = new Set();
  // User to token supply (address => token supply)
  private supply: Record<string, number> = {};

  constructor(
    private publicService: PublicService,
    private db: PrismaService,
  ) {}

  @Get('sync')
  async sync(): Promise<any> {
    let res = null;
    const latestChainBlock = await this.getBlockNumber();
    const latestSyncedBlock = this.getSyncedBlockNumber();
    console.log(
      `latestChainBlock: ${latestChainBlock}, latestSyncedBlock: ${latestSyncedBlock}`,
    );

    // Calculate remaining blocks to sync
    const diffSync = latestChainBlock - latestSyncedBlock;

    if (diffSync > 0) {
      // Max 100 blocks to collect
      const numToSync = Math.min(diffSync, 1000);

      // (Start, End) sync blocks
      const startBlock = latestSyncedBlock;
      const endBlock = latestSyncedBlock + numToSync;

      // Sync between block ranges
      try {
        // Sync start -> end blocks
        res = await this.syncTradeRange(startBlock, endBlock);
        // Recursively resync if diffSync > 0 TODO:open
        // await this.syncTrades();
      } catch (e) {
        throw new Error('Error when syncing between range');
      }
    }

    return res;
  }

  private async getBlockNumber(): Promise<number> {
    const blockNumber = await this.publicService.client.getBlockNumber();
    return Number(blockNumber);
  }

  private getSyncedBlockNumber() {
    // TODO:fetch synced block number
    return Number(FriendTechConstants.CONTRACT_DEPLOY_BLOCK);
  }

  // Promise<void>
  private async syncTradeRange(
    startBlock: number,
    endBlock: number,
  ): Promise<any> {
    // const base = 'https://mainnet.base.org';
    // const provider = new ethers.JsonRpcProvider(base);
    // const friendTechContract = new ethers.Contract(
    //   FriendTechConstants.CONTRACT_ADDRESS,
    //   FriendTechConstants.ABI,
    //   provider,
    // );
    // const filter = friendTechContract.filters.Trade(); // topic0: 0x2c76e7a47fd53e2854856ac3f0a5f3ee40d15cfaa82266357ea9779c486ab9c3
    // const result = await friendTechContract.queryFilter(
    //   filter,
    //   startBlock,
    //   endBlock,
    // );

    const logs = await this.publicService.client.getContractEvents({
      abi: FriendTechConstants.ABI,
      eventName: 'Trade',
      fromBlock: BigInt(startBlock),
      toBlock: BigInt(endBlock),
    });

    const hashArray = logs.map((log) => log.transactionHash);

    // TODO: transaction, transaction receipt 差在哪? 成交前成交後?
    const transactionRequests = [];
    hashArray.forEach(async (hash) => {
      //  Equals to Transactions
      const request = this.publicService.client.getTransaction({
        hash: hash,
      });
      transactionRequests.push(request);
    });

    const transactionReceiptRequests = [];
    hashArray.forEach(async (hash) => {
      // Equals to Transaction Details
      const request = this.publicService.client.getTransactionReceipt({
        hash: hash,
      });
      transactionReceiptRequests.push(request);
    });

    const transactionArray: Array<Transaction> =
      await Promise.all(transactionRequests);

    const transactionReceiptArray: Array<TransactionReceipt> =
      await Promise.all(transactionReceiptRequests);

    const successTransactionReceipt = transactionReceiptArray.filter(
      (tr) => tr.status === 'success',
    );

    // console.log(transactionArray);
    // console.log(transactionReceiptArray);

    // TODO:data mapping 成需要的資料格式
    // Transform only successful transactions
    const transformedTransactions: Array<TransformedTransaction> = [];

    // List of users with modified supply balances
    const userDiff: Set<string> = new Set();
    // List of new, untracked users
    const newUsers: Set<string> = new Set();

    // TODO:Another way to get transaction details
    // for (const transactionReceipt of successTransactionReceipt) {
    //   const result = decodeEventLog({
    //     eventName: 'Trade',
    //     abi: FriendTechConstants.ABI,
    //     data: transactionReceipt.logs[0].data,
    //     topics: [
    //       '0x2c76e7a47fd53e2854856ac3f0a5f3ee40d15cfaa82266357ea9779c486ab9c3',
    //     ],
    //   });
    //   console.log(result);
    // }

    for (const transaction of transactionArray) {
      // TODO:only collect success transaction
      const result = decodeAbiParameters(
        parseAbiParameters('address, uint256'),
        slice(transaction.input, 4),
      );

      const subject = result[0];
      const amount = Number(result[1]);
      const isBuy =
        transaction.input.slice(0, 10) === FriendTechConstants.SIGNATURES.BUY;

      const cost = this.getTradeCost(subject, amount, isBuy);

      const block = await this.publicService.client.getBlock({
        blockHash: transaction.blockHash,
      });

      const { timestamp } = block;

      // Push newly tracked transaction
      const transformedTransaction = {
        hash: transaction.hash,
        timestamp: Number(timestamp),
        blockNumber: Number(transaction.blockNumber),
        from: transaction.from.toLowerCase(),
        subject,
        isBuy,
        amount,
        cost: Math.trunc(cost * 1e18),
      };
      transformedTransactions.push(transformedTransaction);

      // Apply user token supply update
      if (isBuy) {
        this.supply[subject] += amount;
      } else {
        this.supply[subject] -= amount;
      }
      // Track user with supply diff
      userDiff.add(subject);

      // Track new users
      if (!this.users.has(transformedTransaction.from)) {
        this.users.add(transformedTransaction.from);
        newUsers.add(transformedTransaction.from);
      }
      if (!this.users.has(transformedTransaction.subject)) {
        this.users.add(transformedTransaction.subject);
        newUsers.add(transformedTransaction.subject);
      }
    }

    console.log(`Collected ${transformedTransactions.length} transactions`);

    // Setup subject updates
    const subjectUpserts = [];
    for (const subject of new Set([...userDiff, ...newUsers])) {
      subjectUpserts.push(
        this.db.user.upsert({
          where: {
            address: subject,
          },
          create: {
            address: subject,
            supply: this.supply[subject] ?? 0,
          },
          update: {
            supply: this.supply[subject] ?? 0,
          },
        }),
      );
    }

    // Setup trade updates
    const tradeInsert = this.db.trade.createMany({
      data: transformedTransactions.map((tx) => ({
        hash: tx.hash,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber,
        fromAddress: tx.from,
        subjectAddress: tx.subject,
        isBuy: tx.isBuy,
        amount: tx.amount,
        cost: tx.cost,
      })),
    });

    // Insert subjects and trades as atomic transaction
    await this.db.$transaction([...subjectUpserts, tradeInsert]);
    console.log(
      `Added ${subjectUpserts.length} subject updates, ${transformedTransactions.length} trades`,
    );

    return transformedTransactions;
  }

  private getTradeCost(subject: string, amount: number, buy: boolean): number {
    // If subject supply is not tracked locally
    if (!this.supply.hasOwnProperty(subject)) {
      // Update to 0
      this.supply[subject] = 0;
    }

    if (buy) {
      // Return price to buy tokens
      const cost = getPrice(this.supply[subject], amount);
      const fees = cost * FriendTechConstants.FEE * 2;
      return cost + fees;
    } else {
      // Return price to sell tokens
      const cost = getPrice(this.supply[subject] - amount, amount);
      const fees = cost * FriendTechConstants.FEE * 2;
      return cost - fees;
    }
  }
}
