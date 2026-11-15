-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Enable pgvector before creating vector columns.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('OPEN', 'MATCHED', 'CLAIM_PENDING', 'RETURNED', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('ID_CARD', 'PHONE', 'BOOK', 'GADGET', 'WALLET', 'KEYS', 'BAG', 'OTHER');

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('READY', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED', 'EXPIRED', 'COLLECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "type" "ItemType" NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'OPEN',
    "category" "ItemCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "publicDescription" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "eventTag" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "reporterId" UUID NOT NULL,
    "holdLocation" TEXT,
    "embeddingStatus" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
    "publicEmbedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPrivate" (
    "itemId" UUID NOT NULL,
    "privateDetails" TEXT,
    "privateImageUrl" TEXT,
    "privateEmbedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPrivate_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" UUID NOT NULL,
    "lostItemId" UUID NOT NULL,
    "foundItemId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" UUID NOT NULL,
    "foundItemId" UUID NOT NULL,
    "lostItemId" UUID,
    "claimantId" UUID NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "prompts" JSONB NOT NULL,
    "answers" JSONB,
    "proofScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "breakdown" JSONB NOT NULL,
    "attemptNo" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "tokenHash" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "decidedBy" UUID,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Item_type_status_category_zone_createdAt_idx" ON "Item"("type", "status", "category", "zone", "createdAt");

-- CreateIndex
CREATE INDEX "Match_lostItemId_idx" ON "Match"("lostItemId");

-- CreateIndex
CREATE INDEX "Match_foundItemId_idx" ON "Match"("foundItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_lostItemId_foundItemId_key" ON "Match"("lostItemId", "foundItemId");

-- CreateIndex
CREATE INDEX "Claim_foundItemId_status_idx" ON "Claim"("foundItemId", "status");

-- CreateIndex
CREATE INDEX "Claim_claimantId_idx" ON "Claim"("claimantId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_createdAt_idx" ON "AuditLog"("entity", "entityId", "createdAt");

-- Approximate cosine search indexes for public matching and private proof.
CREATE INDEX "Item_publicEmbedding_hnsw_idx"
ON "Item" USING hnsw ("publicEmbedding" vector_cosine_ops);

CREATE INDEX "ItemPrivate_privateEmbedding_hnsw_idx"
ON "ItemPrivate" USING hnsw ("privateEmbedding" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPrivate" ADD CONSTRAINT "ItemPrivate_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_lostItemId_fkey" FOREIGN KEY ("lostItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_lostItemId_fkey" FOREIGN KEY ("lostItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
