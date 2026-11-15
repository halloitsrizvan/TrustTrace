import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CurrentUser } from '../auth/auth.types.js';
import { EmbeddingStatus, ItemStatus, ItemType } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { matchingScore, tokenJaccard } from '../scoring/matching-score.js';
import { MATCHING_CONFIG } from '../scoring/scoring.config.js';

interface VectorCandidate {
  id: string;
  cosine: number;
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async runForItem(itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return [];
    const opposite = item.type === ItemType.LOST ? ItemType.FOUND : ItemType.LOST;
    let ranked: VectorCandidate[] = [];

    if (item.embeddingStatus === EmbeddingStatus.READY) {
      ranked = await this.prisma.$queryRaw<VectorCandidate[]>(Prisma.sql`
        SELECT candidate."id", 1 - (candidate."publicEmbedding" <=> source."publicEmbedding") AS cosine
        FROM "Item" candidate
        CROSS JOIN "Item" source
        WHERE source."id" = ${item.id}::uuid
          AND candidate."type" = ${opposite}::"ItemType"
          AND candidate."category" = ${item.category}::"ItemCategory"
          AND candidate."status" IN ('OPEN'::"ItemStatus", 'MATCHED'::"ItemStatus")
          AND candidate."publicEmbedding" IS NOT NULL
        ORDER BY candidate."publicEmbedding" <=> source."publicEmbedding"
        LIMIT ${MATCHING_CONFIG.candidateLimit}
      `);
    }

    if (!ranked.length) {
      const candidates = await this.prisma.item.findMany({
        where: {
          type: opposite,
          category: item.category,
          status: { in: [ItemStatus.OPEN, ItemStatus.MATCHED] },
        },
        take: 100,
      });
      const sourceText = this.canonical(item);
      ranked = candidates
        .map((candidate) => ({
          id: candidate.id,
          cosine:
            0.5 + 0.5 * tokenJaccard(sourceText, this.canonical(candidate)),
        }))
        .sort((left, right) => right.cosine - left.cosine)
        .slice(0, MATCHING_CONFIG.candidateLimit);
    }

    const candidates = await this.prisma.item.findMany({
      where: { id: { in: ranked.map(({ id }) => id) } },
      include: { reporter: { select: { id: true, name: true } } },
    });
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    const stored = [];
    for (const candidateRank of ranked) {
      const candidate = byId.get(candidateRank.id);
      if (!candidate) continue;
      const lost = item.type === ItemType.LOST ? item : candidate;
      const found = item.type === ItemType.FOUND ? item : candidate;
      const result = matchingScore({
        cosine: candidateRank.cosine,
        lostZone: lost.zone,
        foundZone: found.zone,
        lostAt: lost.occurredAt,
        foundAt: found.occurredAt,
      });
      if (result.score < MATCHING_CONFIG.storeThreshold) continue;
      const existing = await this.prisma.match.findUnique({
        where: {
          lostItemId_foundItemId: { lostItemId: lost.id, foundItemId: found.id },
        },
      });
      const match = await this.prisma.match.upsert({
        where: {
          lostItemId_foundItemId: { lostItemId: lost.id, foundItemId: found.id },
        },
        create: {
          lostItemId: lost.id,
          foundItemId: found.id,
          score: result.score,
          breakdown: result.breakdown,
        },
        update: { score: result.score, breakdown: result.breakdown },
      });
      await this.prisma.item.updateMany({
        where: { id: { in: [lost.id, found.id] }, status: ItemStatus.OPEN },
        data: { status: ItemStatus.MATCHED },
      });
      if (!existing) {
        await this.prisma.auditLog.create({
          data: {
            action: 'MATCH_CREATED',
            entity: 'Match',
            entityId: match.id,
            meta: { lostItemId: lost.id, foundItemId: found.id, score: result.score },
          },
        });
        if (result.score >= MATCHING_CONFIG.notifyThreshold) {
          const counterpart = candidate;
          await Promise.all([
            this.notifications.create(item.reporterId, 'STRONG_MATCH', {
              itemId: item.id,
              matchedItemId: counterpart.id,
              score: result.score,
            }),
            this.notifications.create(counterpart.reporterId, 'STRONG_MATCH', {
              itemId: counterpart.id,
              matchedItemId: item.id,
              score: result.score,
            }),
          ]);
        }
      }
      stored.push({
        id: match.id,
        score: match.score,
        breakdown: result.breakdown,
        createdAt: match.createdAt,
        item: candidate,
      });
    }
    return stored;
  }

  async listForReporter(itemId: string, user: CurrentUser) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.reporterId !== user.id) {
      throw new ForbiddenException('Only the reporter can view matches');
    }
    const matches = await this.prisma.match.findMany({
      where:
        item.type === ItemType.LOST
          ? { lostItemId: item.id }
          : { foundItemId: item.id },
      orderBy: { score: 'desc' },
      include: {
        lostItem: { include: { reporter: { select: { id: true, name: true } } } },
        foundItem: { include: { reporter: { select: { id: true, name: true } } } },
      },
    });
    return matches.map((match) => ({
      id: match.id,
      score: match.score,
      breakdown: match.breakdown,
      createdAt: match.createdAt,
      item: item.type === ItemType.LOST ? match.foundItem : match.lostItem,
    }));
  }

  private canonical(item: { title: string; category: string; publicDescription: string }) {
    return `${item.title} ${item.category} ${item.publicDescription}`;
  }
}
