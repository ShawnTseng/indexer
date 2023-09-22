import { Controller, Get } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller()
export class AppController {
  constructor(private publicService: PublicService) { }

  @Get()
  async getHello(): Promise<string> {
    return 'Hello';
  }

  @Get('getBlockNumber')
  async getBlockNumber(): Promise<bigint> {
    const blockNumber = await this.publicService.client.getBlockNumber();
    return blockNumber;
  }
}
