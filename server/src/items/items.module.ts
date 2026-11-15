import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import { EmbeddingsModule } from '../embeddings/embeddings.module.js';
import { MatchingModule } from '../matching/matching.module.js';

@Module({
  imports: [EmbeddingsModule, MatchingModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
