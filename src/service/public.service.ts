import { Injectable } from '@nestjs/common';
import { PublicClient, http, createPublicClient } from 'viem';
import { base } from 'viem/chains';

@Injectable()
export class PublicService {
  client!: PublicClient;

  constructor() {
    this.client = createPublicClient({
      chain: base,
      transport: http(),
    });
  }
}
