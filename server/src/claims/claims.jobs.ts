import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClaimStatus, ItemStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ClaimsJobs {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async expire(): Promise<void> {
    const expiredClaims = await this.prisma.claim.findMany({
      where: { status: ClaimStatus.APPROVED, tokenExpiresAt: { lt: new Date() } },
      select: { id: true, foundItemId: true },
    });
    for (const claim of expiredClaims) {
      await this.prisma.$transaction([
        this.prisma.claim.update({ where: { id: claim.id }, data: { status: ClaimStatus.EXPIRED, tokenHash: null } }),
        this.prisma.item.update({ where: { id: claim.foundItemId }, data: { status: ItemStatus.OPEN } }),
        this.prisma.auditLog.create({ data: { action: 'CLAIM_EXPIRED', entity: 'Claim', entityId: claim.id, meta: {} } }),
      ]);
    }
    const cutoff = new Date(Date.now() - 30 * 24 * 3_600_000);
    await this.prisma.item.updateMany({ where: { status: ItemStatus.OPEN, createdAt: { lt: cutoff } }, data: { status: ItemStatus.EXPIRED } });
  }
}
