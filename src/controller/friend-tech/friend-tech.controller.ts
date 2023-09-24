import { Controller, Get } from '@nestjs/common';
import { PublicService } from '../../service/public.service';
import FriendTechConstants from './friend-tech-constants';
import { ethers } from 'ethers';

@Controller('friend-tech')
export class FriendTechController {
  constructor(private publicService: PublicService) { }

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

    const transactions = logs.map((log) => log.transactionHash);

    return transactions;
  }
}
