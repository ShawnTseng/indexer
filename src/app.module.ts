import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PublicService } from './service/public.service';
import { AccountController } from './controller/account.controller';
import { BlockController } from './controller/block.controller';
import { FriendTechController } from './controller/friend-tech/friend-tech.controller';
import { PrismaService } from './prisma/prisma.service';
import { PrismaService } from './service/prisma/prisma.service';

@Module({
  controllers: [
    AppController,
    AccountController,
    BlockController,
    FriendTechController,
  ],
  providers: [PublicService, PrismaService],
})
export class AppModule {}
