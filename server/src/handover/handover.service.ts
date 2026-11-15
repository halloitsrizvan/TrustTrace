import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { CurrentUser } from '../auth/auth.types.js';
import { ClaimStatus, ItemStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HandoverService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  async scan(token: string, admin: CurrentUser) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const claim = await this.prisma.claim.findFirst({ where: { tokenHash }, include: { foundItem: true, claimant: true } });
    if (!claim) throw new BadRequestException('Invalid handover token');
    if (claim.status !== ClaimStatus.APPROVED) throw new ConflictException('Token was already used');
    if (!claim.tokenExpiresAt || claim.tokenExpiresAt <= new Date()) throw new BadRequestException('Handover token expired');
    await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT "id" FROM "Claim" WHERE "id" = ${claim.id}::uuid FOR UPDATE`);
      const current = await transaction.claim.findUniqueOrThrow({ where: { id: claim.id } });
      if (current.status !== ClaimStatus.APPROVED) throw new ConflictException('Token was already used');
      await transaction.claim.update({ where: { id: claim.id }, data: { status: ClaimStatus.COLLECTED, tokenHash: null } });
      await transaction.item.update({ where: { id: claim.foundItemId }, data: { status: ItemStatus.RETURNED } });
      if (claim.lostItemId) await transaction.item.update({ where: { id: claim.lostItemId }, data: { status: ItemStatus.RETURNED } });
      await transaction.user.update({ where: { id: claim.claimantId }, data: { trustScore: Math.min(100, claim.claimant.trustScore + 10) } });
      await transaction.auditLog.create({ data: { actorId: admin.id, action: 'HANDOVER_COMPLETED', entity: 'Claim', entityId: claim.id, meta: { foundItemId: claim.foundItemId } } });
    });
    await Promise.all([
      this.notifications.create(claim.claimantId, 'HANDOVER_COMPLETED', { claimId: claim.id }),
      this.notifications.create(claim.foundItem.reporterId, 'HANDOVER_COMPLETED', { claimId: claim.id, foundItemId: claim.foundItemId }),
    ]);
    return { status: ClaimStatus.COLLECTED, claimId: claim.id };
  }
}
