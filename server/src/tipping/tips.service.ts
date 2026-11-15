import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClaimStatus, Role, TipStatus, WalletEntryReason, WalletEntryType } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CurrentUser } from '../auth/auth.types.js';
import type { CreateTipDto } from './dto/create-tip.dto.js';
import { sanitizeTipMessage } from './message-sanitizer.js';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider.js';
import { TIPPING_CONFIG } from './tipping.config.js';
import { RecognitionService } from './recognition.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { TipQueryDto } from './dto/tip-query.dto.js';

@Injectable()
export class TipsService {
  constructor(private readonly prisma: PrismaService, @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider, private readonly recognition: RecognitionService, private readonly notifications: NotificationsService) {}

  async eligibility(claimId: string, user: CurrentUser) {
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId }, include: { foundItem: { include: { reporter: true } }, tip: true } });
    const expiresAt = claim ? new Date(claim.updatedAt.getTime() + TIPPING_CONFIG.tipWindowDays * 86_400_000) : new Date(0);
    let reason: string | undefined;
    if (!claim || claim.claimantId !== user.id) reason = 'Claim not found';
    else if (claim.status !== ClaimStatus.COLLECTED) reason = 'Handover is not complete';
    else if (expiresAt <= new Date()) reason = 'Tip window expired';
    else if (claim.tip) reason = 'A tip already exists for this claim';
    else if (claim.foundItem.reporterId === user.id) reason = 'Self-tipping is not allowed';
    else if (claim.foundItem.reporter.role === Role.ADMIN) reason = 'Campus staff cannot receive tips';
    return { eligible: !reason, ...(reason ? { reason } : {}), suggestedAmountsMinor: [...TIPPING_CONFIG.suggestedTipsMinor], minMinor: TIPPING_CONFIG.minTipMinor, maxMinor: TIPPING_CONFIG.maxTipMinor, expiresAt };
  }

  async create(user: CurrentUser, input: CreateTipDto, idempotencyKey: string) {
    if (!idempotencyKey) throw new BadRequestException('Idempotency-Key header is required');
    const existing = await this.prisma.tip.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.tipperId !== user.id) throw new ConflictException('Idempotency key is already in use');
      return { tipId: existing.id, status: existing.status, clientPayload: { provider: existing.provider, orderId: existing.providerOrderId, amountMinor: existing.amountMinor, currency: existing.currency } };
    }
    const eligibility = await this.eligibility(input.claimId, user);
    if (!eligibility.eligible) throw new ConflictException(eligibility.reason);
    const claim = await this.prisma.claim.findUniqueOrThrow({ where: { id: input.claimId }, include: { foundItem: { include: { reporter: true } } } });
    if (claim.foundItem.reporter.email.toLowerCase() === user.email.toLowerCase()) throw new BadRequestException('Self-tipping is not allowed');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const aggregate = await this.prisma.tip.aggregate({ where: { tipperId: user.id, createdAt: { gte: today }, status: { in: [TipStatus.PENDING, TipStatus.SUCCEEDED] } }, _sum: { amountMinor: true } });
    if ((aggregate._sum.amountMinor ?? 0) + input.amountMinor > TIPPING_CONFIG.dailyTipCapMinor) throw new BadRequestException('Daily tip cap exceeded');
    const tip = await this.prisma.tip.create({ data: { claimId: claim.id, tipperId: user.id, finderId: claim.foundItem.reporterId, amountMinor: input.amountMinor, message: sanitizeTipMessage(input.message), anonymous: input.anonymous, provider: 'mock', idempotencyKey } });
    const order = await this.payments.createOrder({ amountMinor: tip.amountMinor, currency: tip.currency, tipId: tip.id });
    await this.prisma.tip.update({ where: { id: tip.id }, data: { providerOrderId: order.providerOrderId } });
    await this.prisma.auditLog.create({ data: { actorId: user.id, action: 'TIP_CREATED', entity: 'Tip', entityId: tip.id, meta: { amountMinor: tip.amountMinor } } });
    return { tipId: tip.id, status: tip.status, clientPayload: order.clientPayload };
  }

  async confirm(id: string, user: CurrentUser) {
    const tip = await this.prisma.tip.findUnique({ where: { id } });
    if (!tip) throw new NotFoundException('Tip not found');
    if (tip.tipperId !== user.id) throw new ForbiddenException('Tip is not yours');
    return this.settle(tip.id, `mock_payment_${tip.id}`, TipStatus.SUCCEEDED);
  }

  async settle(tipId: string, providerPaymentId: string, status: TipStatus) {
    const settled = await this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT "id" FROM "Tip" WHERE "id" = ${tipId}::uuid FOR UPDATE`);
      const tip = await transaction.tip.findUniqueOrThrow({ where: { id: tipId } });
      if (tip.status === TipStatus.SUCCEEDED || tip.status !== TipStatus.PENDING) return { tip, transitioned: false };
      if (status === TipStatus.FAILED) return { tip: await transaction.tip.update({ where: { id: tip.id }, data: { status } }), transitioned: true };
      const settled = await transaction.tip.update({ where: { id: tip.id }, data: { status: TipStatus.SUCCEEDED, succeededAt: new Date(), providerPaymentId } });
      await transaction.walletEntry.create({ data: { userId: tip.finderId, type: WalletEntryType.CREDIT, amountMinor: tip.amountMinor, reason: WalletEntryReason.TIP_RECEIVED, refId: tip.id } });
      await transaction.auditLog.create({ data: { actorId: tip.tipperId, action: 'TIP_SUCCEEDED', entity: 'Tip', entityId: tip.id, meta: { amountMinor: tip.amountMinor } } });
      return { tip: settled, transitioned: true };
    });
    if (settled.transitioned && settled.tip.status === TipStatus.SUCCEEDED) {
      await this.recognition.afterTip(settled.tip);
    } else if (settled.transitioned && settled.tip.status === TipStatus.FAILED) {
      await this.prisma.auditLog.create({ data: { action: 'TIP_FAILED', entity: 'Tip', entityId: settled.tip.id, meta: {} } });
    }
    return settled.tip;
  }

  async given(userId: string, query: TipQueryDto) {
    const rows = await this.prisma.tip.findMany({
      where: { tipperId: userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { finder: { select: { id: true, name: true } } },
    });
    return this.page(rows, query.limit);
  }

  async received(userId: string, query: TipQueryDto) {
    const rows = await this.prisma.tip.findMany({
      where: { finderId: userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { tipper: { select: { id: true, name: true } } },
    });
    const page = this.page(rows, query.limit);
    return {
      ...page,
      items: page.items.map(({ tipper, tipperId, ...tip }) =>
        tip.anonymous ? tip : { ...tip, tipperId, tipper },
      ),
    };
  }

  async wallet(userId: string, query: TipQueryDto) {
    const [credits, debits, rows] = await Promise.all([
      this.prisma.walletEntry.aggregate({ where: { userId, type: WalletEntryType.CREDIT }, _sum: { amountMinor: true } }),
      this.prisma.walletEntry.aggregate({ where: { userId, type: WalletEntryType.DEBIT }, _sum: { amountMinor: true } }),
      this.prisma.walletEntry.findMany({ where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit + 1, ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}) }),
    ]);
    const page = this.page(rows, query.limit);
    return { balanceMinor: (credits._sum.amountMinor ?? 0) - (debits._sum.amountMinor ?? 0), entries: page.items, nextCursor: page.nextCursor };
  }

  private page<T extends { id: string }>(rows: T[], limit: number) {
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? items.at(-1)!.id : null };
  }
}
