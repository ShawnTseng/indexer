import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Address, BlockTag, GetBalanceParameters, GetTransactionCountParameters, PublicClient, createPublicClient, formatEther, http } from 'viem';
import { base } from 'viem/chains';

@Controller()
export class AppController {
  client!: PublicClient;

  constructor() {
    this.client = createPublicClient({
      chain: base,
      transport: http(),
    });
  }

  @Get()
  async getHello(): Promise<string> {
    return 'Hello';
  }

  @Get('getBlockNumber')
  async getBlockNumber(): Promise<bigint> {
    const blockNumber = await this.client.getBlockNumber();
    return blockNumber;
  }

  @Get('getBalance')
  async getBalance(@Query() query): Promise<bigint> {
    const { address } = query;
    const params: GetBalanceParameters = { address };
    const balance = await this.client.getBalance(params);
    // const balanceAsEther = formatEther(balance);
    return balance;
  }

  @Get('getTransactionCount')
  async getTransactionCount(@Query() query): Promise<number> {
    const { address } = query;
    const params: GetTransactionCountParameters = { address };
    const transactionCount = await this.client.getTransactionCount(params);
    return transactionCount;
  }
}
