import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PublicService } from './public.service';
import { AccountController } from './account.controller';
import { BlockController } from './block.controller';

@Module({
  controllers: [AppController, AccountController, BlockController],
  providers: [PublicService],
})
export class AppModule {}
