import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClaimStatus, Role, TipStatus, WalletEntryReason, WalletEntryType } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CurrentUser } from '../auth/auth.types.js';
import type { CreateTipDto } from './dto/create-tip.dto.js';
import { sanitizeTipMessage } from './message-sanitizer.js';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider.js';
import { TIPPING_CONFIG } from './tipping.config.js';

@Injectable()
export class TipsService {
  constructor(private readonly prisma: PrismaService, @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider) {}

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
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT "id" FROM "Tip" WHERE "id" = ${tipId}::uuid FOR UPDATE`);
      const tip = await transaction.tip.findUniqueOrThrow({ where: { id: tipId } });
      if (tip.status === TipStatus.SUCCEEDED || tip.status !== TipStatus.PENDING) return tip;
      if (status === TipStatus.FAILED) return transaction.tip.update({ where: { id: tip.id }, data: { status } });
      const settled = await transaction.tip.update({ where: { id: tip.id }, data: { status: TipStatus.SUCCEEDED, succeededAt: new Date(), providerPaymentId } });
      await transaction.walletEntry.create({ data: { userId: tip.finderId, type: WalletEntryType.CREDIT, amountMinor: tip.amountMinor, reason: WalletEntryReason.TIP_RECEIVED, refId: tip.id } });
      await transaction.auditLog.create({ data: { actorId: tip.tipperId, action: 'TIP_SUCCEEDED', entity: 'Tip', entityId: tip.id, meta: { amountMinor: tip.amountMinor } } });
      return settled;
    });
  }
}
