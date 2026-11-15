import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CurrentUser } from '../auth/auth.types.js';
import { ClaimsService } from '../claims/claims.service.js';
import { ClaimStatus } from '../generated/prisma/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AdminClaimsQueryDto, AdminDecisionDto } from './dto/admin-claims.dto.js';
import type { AdminAuditQueryDto } from './dto/admin-audit.dto.js';
import { ClaimStatus as Status } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly claims: ClaimsService,
    private readonly notifications: NotificationsService,
  ) {}

  listClaims(query: AdminClaimsQueryDto) {
    return this.prisma.claim.findMany({
      where: { status: query.status },
      orderBy: { createdAt: 'desc' },
      include: {
        claimant: { select: { id: true, email: true, name: true, trustScore: true } },
        foundItem: { include: { private: true } },
        lostItem: { include: { private: true } },
      },
    });
  }

  async decide(id: string, input: AdminDecisionDto, admin: CurrentUser) {
    const claim = await this.prisma.claim.findUnique({ where: { id }, include: { claimant: true } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== ClaimStatus.FLAGGED) throw new BadRequestException('Only flagged claims can be reviewed');
    let handoverToken: string | undefined;
    if (input.decision === 'APPROVE') {
      handoverToken = (await this.claims.issueToken(id, admin.id)).token;
    } else {
      await this.prisma.$transaction([
        this.prisma.claim.update({ where: { id }, data: { status: ClaimStatus.REJECTED, decidedBy: admin.id, decisionNote: input.note } }),
        this.prisma.user.update({ where: { id: claim.claimantId }, data: { trustScore: Math.max(0, claim.claimant.trustScore - 10) } }),
        this.prisma.auditLog.create({ data: { actorId: admin.id, action: 'ADMIN_CLAIM_REJECTED', entity: 'Claim', entityId: id, meta: { note: input.note ?? null } } }),
      ]);
    }
    await this.notifications.create(claim.claimantId, 'CLAIM_DECISION', { claimId: id, decision: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' });
    return { decision: input.decision, ...(handoverToken ? { handoverToken } : {}) };
  }

  async stats() {
    const [totalItems, reunitedCount, fraudBlockedCount, openFlagged, durations, zones, hours] = await Promise.all([
      this.prisma.item.count(),
      this.prisma.claim.count({ where: { status: Status.COLLECTED } }),
      this.prisma.claim.count({ where: { status: Status.REJECTED } }),
      this.prisma.claim.count({ where: { status: Status.FLAGGED } }),
      this.prisma.$queryRaw<Array<{ average: number | null }>>(Prisma.sql`
        SELECT AVG(EXTRACT(EPOCH FROM (claim."updatedAt" - item."createdAt")) / 3600)::float AS average
        FROM "Claim" claim JOIN "Item" item ON item."id" = claim."foundItemId"
        WHERE claim."status" = 'COLLECTED'::"ClaimStatus"
      `),
      this.prisma.$queryRaw<Array<{ key: string; count: bigint }>>(Prisma.sql`
        SELECT "zone" AS key, COUNT(*) AS count FROM "Item"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY "zone" ORDER BY count DESC
      `),
      this.prisma.$queryRaw<Array<{ key: number; count: bigint }>>(Prisma.sql`
        SELECT EXTRACT(HOUR FROM "occurredAt")::int AS key, COUNT(*) AS count FROM "Item"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY key ORDER BY key
      `),
    ]);
    return {
      totalItems,
      reunitedCount,
      avgHoursToReunite: Number((durations[0]?.average ?? 0).toFixed(2)),
      fraudBlockedCount,
      openFlagged,
      zones: zones.map(({ key, count }) => ({ key, count: Number(count) })),
      hours: hours.map(({ key, count }) => ({ key: String(key), count: Number(count) })),
    };
  }

  async audit(query: AdminAuditQueryDto) {
    const rows = await this.prisma.auditLog.findMany({
      where: { entity: query.entity },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const logs = hasMore ? rows.slice(0, query.limit) : rows;
    return { logs, nextCursor: hasMore ? logs.at(-1)!.id : null };
  }
}
