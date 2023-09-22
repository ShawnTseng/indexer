import { Controller, Get } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('block')
export class BlockController {
  constructor(private publicService: PublicService) {}

  @Get('getBlockNumber')
  async getBlockNumber(): Promise<bigint> {
    const blockNumber = await this.publicService.client.getBlockNumber();
    return blockNumber;
  }
}
