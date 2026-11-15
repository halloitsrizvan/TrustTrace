CREATE TYPE "TipStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'EXPIRED');
CREATE TYPE "WalletEntryType" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "WalletEntryReason" AS ENUM ('TIP_RECEIVED', 'WITHDRAWAL', 'REFUND');
CREATE TYPE "Badge" AS ENUM ('FIRST_RETURN', 'CAMPUS_HERO', 'GUARDIAN', 'GRATEFUL_SOUL', 'GENEROUS');

ALTER TABLE "User" ADD COLUMN "karma" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Tip" (
  "id" UUID NOT NULL,
  "claimId" UUID NOT NULL,
  "tipperId" UUID NOT NULL,
  "finderId" UUID NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "TipStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "anonymous" BOOLEAN NOT NULL DEFAULT false,
  "provider" TEXT NOT NULL,
  "providerOrderId" TEXT,
  "providerPaymentId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "succeededAt" TIMESTAMP(3),
  CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletEntry" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "WalletEntryType" NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "reason" "WalletEntryReason" NOT NULL,
  "refId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBadge" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "badge" "Badge" NOT NULL,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KarmaEvent" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "refId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KarmaEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tip_claimId_key" ON "Tip"("claimId");
CREATE UNIQUE INDEX "Tip_providerOrderId_key" ON "Tip"("providerOrderId");
CREATE UNIQUE INDEX "Tip_providerPaymentId_key" ON "Tip"("providerPaymentId");
CREATE UNIQUE INDEX "Tip_idempotencyKey_key" ON "Tip"("idempotencyKey");
CREATE INDEX "Tip_finderId_status_idx" ON "Tip"("finderId", "status");
CREATE INDEX "Tip_tipperId_idx" ON "Tip"("tipperId");
CREATE INDEX "WalletEntry_userId_idx" ON "WalletEntry"("userId");
CREATE UNIQUE INDEX "WalletEntry_reason_refId_key" ON "WalletEntry"("reason", "refId");
CREATE UNIQUE INDEX "UserBadge_userId_badge_key" ON "UserBadge"("userId", "badge");
CREATE INDEX "KarmaEvent_userId_idx" ON "KarmaEvent"("userId");
CREATE INDEX "KarmaEvent_refId_idx" ON "KarmaEvent"("refId");
CREATE UNIQUE INDEX "KarmaEvent_userId_reason_refId_key" ON "KarmaEvent"("userId", "reason", "refId");

ALTER TABLE "Tip" ADD CONSTRAINT "Tip_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_tipperId_fkey" FOREIGN KEY ("tipperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_finderId_fkey" FOREIGN KEY ("finderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KarmaEvent" ADD CONSTRAINT "KarmaEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
