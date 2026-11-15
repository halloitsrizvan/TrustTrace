import { Injectable, NotFoundException } from '@nestjs/common';
import { ClaimStatus, TipStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LeaderboardQueryDto } from './recognition.controller.js';

@Injectable()
export class RecognitionProfilesService {
  constructor(private readonly prisma: PrismaService) {}
  async profile(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, name: true, karma: true, badges: { select: { badge: true, awardedAt: true } } } });
    if (!user) throw new NotFoundException('User not found');
    const [returnsCount, tipsReceivedCount] = await Promise.all([
      this.prisma.claim.count({ where: { status: ClaimStatus.COLLECTED, foundItem: { reporterId: id } } }),
      this.prisma.tip.count({ where: { finderId: id, status: TipStatus.SUCCEEDED } }),
    ]);
    return { ...user, returnsCount, tipsReceivedCount };
  }
  async leaderboard(query: LeaderboardQueryDto) {
    const cutoff = query.period === 'week' ? new Date(Date.now() - 7 * 86_400_000) : query.period === 'month' ? new Date(Date.now() - 30 * 86_400_000) : new Date(0);
    const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string; karma: number; returnsCount: bigint }>>(Prisma.sql`
      SELECT users."id", users."name", users."karma", COUNT(claims."id") AS "returnsCount"
      FROM "User" users
      JOIN "Item" items ON items."reporterId" = users."id" AND items."type" = 'FOUND'::"ItemType"
      JOIN "Claim" claims ON claims."foundItemId" = items."id" AND claims."status" = 'COLLECTED'::"ClaimStatus" AND claims."updatedAt" >= ${cutoff}
      GROUP BY users."id" HAVING COUNT(claims."id") > 0
      ORDER BY "returnsCount" DESC, users."karma" DESC LIMIT ${query.limit}
    `);
    const badges = await this.prisma.userBadge.findMany({ where: { userId: { in: rows.map(({ id }) => id) } } });
    return rows.map((row) => ({ id: row.id, name: row.name, karma: row.karma, returnsCount: Number(row.returnsCount), badges: badges.filter(({ userId }) => userId === row.id).map(({ badge }) => badge) }));
  }
}
