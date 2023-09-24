import { Controller, Get } from '@nestjs/common';
import { PublicService } from 'src/service/public.service';

@Controller('block')
export class BlockController {
  constructor(private publicService: PublicService) {}

  @Get('getBlock')
  async getBlock(): Promise<any> {
    const block = await this.publicService.client.getBlock();
    const { baseFeePerGas, difficulty, extraData, gasLimit, gasUsed } = block;
    return `baseFeePerGas: ${baseFeePerGas}     
            difficulty: ${difficulty}     
            extraData: ${extraData}     
            gasLimit: ${gasLimit}     
            gasUsed: ${gasUsed}
            ...
            `;
  }

  @Get('getBlockNumber')
  async getBlockNumber(): Promise<bigint> {
    const blockNumber = await this.publicService.client.getBlockNumber();
    return blockNumber;
  }

  @Get('getBlockTransactionCount')
  async getBlockTransactionCount(): Promise<number> {
    const blockTransactionCount =
      await this.publicService.client.getBlockTransactionCount();
    return blockTransactionCount;
  }
}
