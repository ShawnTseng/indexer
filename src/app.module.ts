import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PublicService } from './service/public.service';
import { AccountController } from './controller/account.controller';
import { BlockController } from './controller/block.controller';
import { FriendTechController } from './controller/friend-tech/friend-tech.controller';
import { PrismaService } from './service/prisma.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [
    AppController,
    AccountController,
    BlockController,
    FriendTechController,
  ],
  providers: [PublicService, PrismaService],
})
export class AppModule {}
