import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CurrentUser } from '../auth/auth.types.js';
import { ClaimsService } from '../claims/claims.service.js';
import { ClaimStatus } from '../generated/prisma/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AdminClaimsQueryDto, AdminDecisionDto } from './dto/admin-claims.dto.js';

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
}
