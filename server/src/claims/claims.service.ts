import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { CurrentUser } from '../auth/auth.types.js';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from '../embeddings/embedding-provider.js';
import { ClaimStatus, ItemStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateClaimScore, decideClaim, privateTokenRecall } from '../scoring/claim-score.js';
import { CLAIM_CONFIG } from '../scoring/scoring.config.js';
import type { StartClaimDto } from './dto/start-claim.dto.js';
import type { SubmitClaimDto } from './dto/submit-claim.dto.js';
import { fallbackPrompts } from './prompts.js';

const cosine = (a: number[], b: number[]) =>
  a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddings: EmbeddingProvider,
  ) {}

  async start(user: CurrentUser, input: StartClaimDto) {
    const found = await this.prisma.item.findUnique({ where: { id: input.foundItemId } });
    if (!found || !new Set<ItemStatus>([ItemStatus.OPEN, ItemStatus.MATCHED]).has(found.status)) {
      throw new BadRequestException('Found item is not claimable');
    }
    if (found.reporterId === user.id) throw new BadRequestException('You cannot claim your own found item');
    if (input.lostItemId) {
      const lost = await this.prisma.item.findUnique({ where: { id: input.lostItemId } });
      if (!lost || lost.reporterId !== user.id) throw new ForbiddenException('Lost item is not yours');
    }
    const active = await this.prisma.claim.count({
      where: { claimantId: user.id, status: { in: [ClaimStatus.PENDING, ClaimStatus.FLAGGED] } },
    });
    if (active >= CLAIM_CONFIG.maxActiveClaims) throw new HttpException('Too many active claims', HttpStatus.TOO_MANY_REQUESTS);
    const attempts = await this.prisma.claim.findMany({
      where: { claimantId: user.id, foundItemId: found.id },
      orderBy: { createdAt: 'desc' },
    });
    if (attempts.length >= CLAIM_CONFIG.maxAttempts) throw new HttpException('Maximum claim attempts reached', HttpStatus.TOO_MANY_REQUESTS);
    const latest = attempts[0];
    if (latest?.status === ClaimStatus.REJECTED && Date.now() - latest.updatedAt.getTime() < CLAIM_CONFIG.cooldownMinutes * 60_000) {
      throw new HttpException('Wait before trying this claim again', HttpStatus.TOO_MANY_REQUESTS);
    }
    const prompts = fallbackPrompts(found.category);
    const claim = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.claim.create({
        data: {
          foundItemId: found.id,
          lostItemId: input.lostItemId,
          claimantId: user.id,
          prompts,
          breakdown: {},
          attemptNo: attempts.length + 1,
        },
      });
      await transaction.auditLog.create({ data: { actorId: user.id, action: 'CLAIM_STARTED', entity: 'Claim', entityId: created.id, meta: { foundItemId: found.id } } });
      return created;
    });
    await this.notifications.create(found.reporterId, 'CLAIM_STARTED', { foundItemId: found.id, claimId: claim.id });
    return { claimId: claim.id, prompts };
  }

  async submit(user: CurrentUser, claimId: string, input: SubmitClaimDto) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimant: true,
        foundItem: { include: { private: true } },
        lostItem: { include: { private: true } },
      },
    });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.claimantId !== user.id) throw new ForbiddenException('This claim is not yours');
    if (claim.status !== ClaimStatus.PENDING || claim.submittedAt) throw new ConflictException('Claim was already submitted');
    const prompts = claim.prompts as Array<{ id: string; text: string }>;
    const answerIds = new Set(input.answers.map(({ promptId }) => promptId));
    if (prompts.some(({ id }) => !answerIds.has(id))) throw new BadRequestException('Every prompt must be answered');
    const answerText = input.answers.map(({ text }) => text.trim()).join(' ');
    const privateDetails = claim.foundItem.private?.privateDetails;
    if (!privateDetails) throw new ConflictException('Found item has no private proof');
    const [answerVector, privateVector, publicVector] = await Promise.all([
      this.embeddings.embedText(answerText),
      this.embeddings.embedText(privateDetails),
      this.embeddings.embedText(`${claim.foundItem.title} ${claim.foundItem.publicDescription}`),
    ]);
    const recall = privateTokenRecall(privateDetails, `${claim.foundItem.title} ${claim.foundItem.publicDescription}`, answerText);
    let timeline = claim.lostItem
      ? claim.lostItem.createdAt < claim.foundItem.createdAt ? 1 : 0.3
      : 0.5;
    if (claim.lostItem?.private?.privateDetails) {
      const lostVector = await this.embeddings.embedText(claim.lostItem.private.privateDetails);
      if (cosine(lostVector, privateVector) >= 0.75) timeline = 1;
    }
    let penalties = Math.max(0, claim.attemptNo - 1) * 0.2;
    if (Date.now() - claim.startedAt.getTime() < 5_000) penalties += 0.3;
    const prior = await this.prisma.claim.findMany({
      where: { claimantId: user.id, foundItemId: { not: claim.foundItemId }, answers: { not: Prisma.DbNull } },
      select: { answers: true },
      take: 10,
    });
    for (const previous of prior) {
      const previousText = (previous.answers as Array<{ text: string }>).map(({ text }) => text).join(' ');
      if (cosine(answerVector, await this.embeddings.embedText(previousText)) > 0.95) { penalties += 0.3; break; }
    }
    const scored = calculateClaimScore({
      proofCosine: cosine(answerVector, privateVector),
      tokenRecall: recall,
      timeline,
      userTrust: claim.claimant.trustScore / 100,
      behaviour: Math.max(0, 1 - penalties),
    });
    const copycat = cosine(answerVector, publicVector) >= CLAIM_CONFIG.copycatCosine && recall === 0;
    const decision = copycat ? ClaimStatus.REJECTED : decideClaim(scored.breakdown.proof, scored.total, claim.foundItem.category) as ClaimStatus;
    await this.prisma.claim.update({
      where: { id: claim.id },
      data: { answers: input.answers.map(({ promptId, text }) => ({ promptId, text })), proofScore: scored.breakdown.proof, trustScore: scored.total, breakdown: scored.breakdown, submittedAt: new Date(), status: decision },
    });
    let handoverToken: string | undefined;
    if (decision === ClaimStatus.APPROVED) handoverToken = (await this.issueToken(claim.id, user.id)).token;
    if (copycat) {
      await this.prisma.user.update({ where: { id: user.id }, data: { trustScore: { decrement: Math.min(20, claim.claimant.trustScore) } } });
      await this.prisma.auditLog.create({ data: { actorId: user.id, action: 'COPYCAT_SUSPECTED', entity: 'Claim', entityId: claim.id, meta: {} } });
    }
    await this.prisma.auditLog.create({ data: { actorId: user.id, action: 'CLAIM_DECIDED', entity: 'Claim', entityId: claim.id, meta: { decision, trustScore: scored.total } } });
    await this.notifications.create(user.id, 'CLAIM_DECISION', { claimId: claim.id, decision, trustScore: scored.total });
    return { decision, trustScore: scored.total, breakdown: scored.breakdown, ...(handoverToken ? { handoverToken } : {}) };
  }

  async issueToken(claimId: string, actorId: string) {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + CLAIM_CONFIG.tokenTtlHours * 3_600_000);
    await this.prisma.$transaction(async (transaction) => {
      const claim = await transaction.claim.findUniqueOrThrow({ where: { id: claimId } });
      const locked = await transaction.$queryRaw<Array<{ status: ItemStatus }>>(Prisma.sql`SELECT "status" FROM "Item" WHERE "id" = ${claim.foundItemId}::uuid FOR UPDATE`);
      if (locked[0]?.status === ItemStatus.CLAIM_PENDING) {
        const holder = await transaction.claim.findFirst({
          where: {
            foundItemId: claim.foundItemId,
            status: ClaimStatus.APPROVED,
            tokenHash: { not: null },
            id: { not: claim.id },
          },
        });
        if (holder) throw new ConflictException('Another claimant already holds this item');
      }
      await transaction.item.update({ where: { id: claim.foundItemId }, data: { status: ItemStatus.CLAIM_PENDING } });
      await transaction.claim.update({ where: { id: claim.id }, data: { status: ClaimStatus.APPROVED, tokenHash, tokenExpiresAt: expiresAt } });
      await transaction.auditLog.create({ data: { actorId, action: 'TOKEN_ISSUED', entity: 'Claim', entityId: claim.id, meta: { expiresAt: expiresAt.toISOString() } } });
    });
    return { token, expiresAt };
  }

  mine(userId: string) { return this.prisma.claim.findMany({ where: { claimantId: userId }, orderBy: { createdAt: 'desc' }, select: this.safeSelect() }); }
  async findOne(id: string, userId: string) {
    const claim = await this.prisma.claim.findFirst({ where: { id, claimantId: userId }, select: this.safeSelect() });
    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }
  async regenerateToken(id: string, user: CurrentUser) {
    const claim = await this.prisma.claim.findFirst({ where: { id, claimantId: user.id } });
    if (!claim || claim.status !== ClaimStatus.APPROVED) throw new BadRequestException('Claim is not approved');
    return this.issueToken(id, user.id);
  }

  private safeSelect() {
    return { id: true, foundItemId: true, lostItemId: true, status: true, prompts: true, answers: true, proofScore: true, trustScore: true, breakdown: true, attemptNo: true, startedAt: true, submittedAt: true, tokenExpiresAt: true, decisionNote: true, createdAt: true } as const;
  }
}
