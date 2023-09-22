import { PublicService } from './public.service';
import { Controller, Get, Query } from '@nestjs/common';
import { GetBalanceParameters, GetTransactionCountParameters } from 'viem';

@Controller('account')
export class AccountController {
  constructor(private publicService: PublicService) {}

  @Get('getBalance')
  async getBalance(@Query() query): Promise<bigint> {
    const { address } = query;
    const params: GetBalanceParameters = { address };
    const balance = await this.publicService.client.getBalance(params);
    // const balanceAsEther = formatEther(balance);
    return balance;
  }

  @Get('getTransactionCount')
  async getTransactionCount(@Query() query): Promise<number> {
    const { address } = query;
    const params: GetTransactionCountParameters = { address };
    const transactionCount =
      await this.publicService.client.getTransactionCount(params);
    return transactionCount;
  }
}
