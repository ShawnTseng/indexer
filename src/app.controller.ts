import { Controller, Get } from '@nestjs/common';
import { PublicClient, createPublicClient, http } from 'viem';
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
  async getHello(): Promise<bigint> {
    const blockNumber = await this.client.getBlockNumber();
    return blockNumber;
  }
}
