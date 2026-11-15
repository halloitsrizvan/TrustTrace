import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmbeddingStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from './embedding-provider.js';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMBEDDING_PROVIDER) private readonly provider: EmbeddingProvider,
  ) {}

  async processItem(itemId: string): Promise<boolean> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { private: true },
    });
    if (!item) return false;

    try {
      let imageDescription = '';
      if (item.imageUrl) {
        try {
          const description = await this.provider.describeImage(item.imageUrl);
          imageDescription = `${description.title} ${description.description}`;
        } catch {
          // Image understanding is optional; text embeddings remain available.
        }
      }
      const canonical = [
        item.title,
        item.category,
        item.publicDescription,
        imageDescription,
      ]
        .filter(Boolean)
        .join(' ');
      const publicEmbedding = await this.provider.embedText(canonical);
      const publicVector = JSON.stringify(publicEmbedding);

      await this.prisma.$executeRaw(
        Prisma.sql`UPDATE "Item" SET "publicEmbedding" = ${publicVector}::vector, "embeddingStatus" = 'READY'::"EmbeddingStatus" WHERE "id" = ${item.id}::uuid`,
      );
      if (item.private?.privateDetails) {
        const privateEmbedding = await this.provider.embedText(
          item.private.privateDetails,
        );
        const privateVector = JSON.stringify(privateEmbedding);
        await this.prisma.$executeRaw(
          Prisma.sql`UPDATE "ItemPrivate" SET "privateEmbedding" = ${privateVector}::vector WHERE "itemId" = ${item.id}::uuid`,
        );
      }
      return true;
    } catch {
      await this.prisma.item.update({
        where: { id: item.id },
        data: { embeddingStatus: EmbeddingStatus.PENDING },
      });
      this.logger.warn(`Embedding deferred for item ${item.id}`);
      return false;
    }
  }

  @Cron('*/2 * * * *')
  async retryPending(): Promise<void> {
    const pending = await this.prisma.item.findMany({
      where: { embeddingStatus: EmbeddingStatus.PENDING },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    for (const item of pending) await this.processItem(item.id);
  }
}
