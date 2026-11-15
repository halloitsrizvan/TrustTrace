import { Injectable } from '@nestjs/common';
import { Badge, ClaimStatus, Role } from '../generated/prisma/enums.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TIPPING_CONFIG } from './tipping.config.js';

@Injectable()
export class RecognitionService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  async awardPairKarma(userId: string, finderId: string, claimantId: string, delta: number, reason: string, refId: string) {
    const cutoff = new Date(Date.now() - TIPPING_CONFIG.pairCooldownDays * 86_400_000);
    const prefix = `pair:${finderId}:${claimantId}:`;
    const prior = await this.prisma.karmaEvent.findFirst({ where: { refId: { startsWith: prefix }, createdAt: { gte: cutoff } } });
    if (prior) {
      await this.prisma.auditLog.create({ data: { action: 'KARMA_PAIR_CAPPED', entity: 'User', entityId: userId, meta: { finderId, claimantId, refId } } });
      return false;
    }
    await this.prisma.$transaction([
      this.prisma.karmaEvent.create({ data: { userId, delta, reason, refId: `${prefix}${refId}` } }),
      this.prisma.user.update({ where: { id: userId }, data: { karma: { increment: delta } } }),
    ]);
    return true;
  }

  async afterReturn(claimId: string, finderId: string, claimantId: string) {
    const finder = await this.prisma.user.findUniqueOrThrow({ where: { id: finderId } });
    if (finder.role !== Role.ADMIN) {
      await this.awardPairKarma(finderId, finderId, claimantId, TIPPING_CONFIG.karma.finderReturn, 'FINDER_RETURN', claimId);
      await this.evaluateReturnBadges(finderId);
    }
    await Promise.all([
      this.notifications.create(claimantId, 'TIP_PROMPT', { claimId, suggestedAmountsMinor: [...TIPPING_CONFIG.suggestedTipsMinor], optional: true }),
      this.notifications.create(finderId, 'RETURN_COMPLETED', { claimId }),
    ]);
  }

  async afterTip(tip: { id: string; finderId: string; tipperId: string; amountMinor: number; anonymous: boolean; message: string | null }) {
    const awarded = await this.awardPairKarma(tip.finderId, tip.finderId, tip.tipperId, TIPPING_CONFIG.karma.finderTipReceived, 'FINDER_TIP_RECEIVED', tip.id);
    if (awarded) {
      await this.prisma.$transaction([
        this.prisma.karmaEvent.create({ data: { userId: tip.tipperId, delta: TIPPING_CONFIG.karma.tipperTipGiven, reason: 'TIPPER_TIP_GIVEN', refId: tip.id } }),
        this.prisma.user.update({ where: { id: tip.tipperId }, data: { karma: { increment: TIPPING_CONFIG.karma.tipperTipGiven } } }),
      ]);
    }
    const tipper = tip.anonymous ? null : await this.prisma.user.findUnique({ where: { id: tip.tipperId }, select: { name: true } });
    await this.notifications.create(tip.finderId, 'TIP_RECEIVED', { amountMinor: tip.amountMinor, message: tip.message, anonymous: tip.anonymous, ...(tipper ? { tipperName: tipper.name } : {}) });
    await this.evaluateTipperBadges(tip.tipperId);
  }

  private async evaluateReturnBadges(userId: string) {
    const returns = await this.prisma.claim.count({ where: { status: ClaimStatus.COLLECTED, foundItem: { reporterId: userId } } });
    const candidates: Array<[Badge, number]> = [[Badge.FIRST_RETURN, 1], [Badge.CAMPUS_HERO, 5], [Badge.GUARDIAN, 10]];
    await this.awardBadges(userId, candidates.filter(([, count]) => returns >= count).map(([badge]) => badge));
  }

  private async evaluateTipperBadges(userId: string) {
    const count = await this.prisma.tip.count({ where: { tipperId: userId, status: 'SUCCEEDED' } });
    const badges: Badge[] = [];
    if (count >= 1) badges.push(Badge.GRATEFUL_SOUL);
    if (count >= 5) badges.push(Badge.GENEROUS);
    await this.awardBadges(userId, badges);
  }

  private async awardBadges(userId: string, badges: Badge[]) {
    for (const badge of badges) {
      const result = await this.prisma.userBadge.createMany({ data: [{ userId, badge }], skipDuplicates: true });
      if (result.count) await this.notifications.create(userId, 'BADGE_EARNED', { badge });
    }
  }
}
