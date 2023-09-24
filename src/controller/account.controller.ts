import { PublicService } from '../service/public.service';
import { Controller, Get, Param } from '@nestjs/common';
import { GetBalanceParameters, GetTransactionCountParameters } from 'viem';

@Controller('account')
export class AccountController {
  constructor(private publicService: PublicService) { }

  @Get('getBalance/:address')
  async getBalance(@Param('address') address: `0x${string}`): Promise<bigint> {
    const params: GetBalanceParameters = { address };
    const balance = await this.publicService.client.getBalance(params);
    // const balanceAsEther = formatEther(balance);
    return balance;
  }

  @Get('getTransactionCount/:address')
  async getTransactionCount(
    @Param('address') address: `0x${string}`,
  ): Promise<number> {
    const params: GetTransactionCountParameters = { address };
    const transactionCount =
      await this.publicService.client.getTransactionCount(params);
    return transactionCount;
  }
}
