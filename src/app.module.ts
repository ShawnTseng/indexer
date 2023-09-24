import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PublicService } from './service/public.service';
import { AccountController } from './controller/account.controller';
import { BlockController } from './controller/block.controller';

@Module({
  controllers: [AppController, AccountController, BlockController],
  providers: [PublicService],
})
export class AppModule {}
