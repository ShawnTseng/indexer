import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PublicService } from './public.service';
import { AccountController } from './account.controller';

@Module({
  controllers: [AppController, AccountController],
  providers: [PublicService],
})
export class AppModule {}
