import 'dotenv/config';
import { hash } from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  Badge,
  ClaimStatus,
  EmbeddingStatus,
  ItemCategory,
  ItemStatus,
  ItemType,
  Role,
} from '../src/generated/prisma/enums.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required to seed the database');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const ids = {
  admin: '10000000-0000-4000-8000-000000000001',
  student: '10000000-0000-4000-8000-000000000002',
  finder: '10000000-0000-4000-8000-000000000003',
  lostPhone: '20000000-0000-4000-8000-000000000001',
  foundPhone: '20000000-0000-4000-8000-000000000002',
  foundKeys: '20000000-0000-4000-8000-000000000003',
  claim: '30000000-0000-4000-8000-000000000001',
  match: '40000000-0000-4000-8000-000000000001',
};

async function main() {
  const passwordHash = await hash('Test@12345');
  const users = [
    { id: ids.admin, email: 'admin@trusttrace.test', name: 'Test Admin', role: Role.ADMIN, trustScore: 90, karma: 40 },
    { id: ids.student, email: 'student@trusttrace.test', name: 'Asha Student', role: Role.STUDENT, trustScore: 72, karma: 15 },
    { id: ids.finder, email: 'finder@trusttrace.test', name: 'Ravi Finder', role: Role.STUDENT, trustScore: 84, karma: 65 },
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, trustScore: user.trustScore, karma: user.karma, passwordHash },
      create: { ...user, passwordHash },
    });
  }

  const occurredAt = new Date('2026-11-14T09:30:00.000Z');
  await prisma.item.upsert({ where: { id: ids.lostPhone }, update: {}, create: {
    id: ids.lostPhone, type: ItemType.LOST, status: ItemStatus.MATCHED, category: ItemCategory.PHONE,
    title: 'Lost black Android phone', publicDescription: 'Black phone lost near the library entrance.',
    zone: 'LIBRARY', occurredAt, reporterId: ids.student, embeddingStatus: EmbeddingStatus.FAILED,
    private: { create: { privateDetails: 'Blue mountain wallpaper and a cracked lower-right corner.' } },
  }});
  await prisma.item.upsert({ where: { id: ids.foundPhone }, update: {}, create: {
    id: ids.foundPhone, type: ItemType.FOUND, status: ItemStatus.CLAIM_PENDING, category: ItemCategory.PHONE,
    title: 'Found black Android phone', publicDescription: 'A black phone found outside the library.',
    zone: 'LIBRARY', occurredAt: new Date('2026-11-14T10:00:00.000Z'), reporterId: ids.finder,
    holdLocation: 'Security desk', embeddingStatus: EmbeddingStatus.FAILED,
    private: { create: { privateDetails: 'Wallpaper shows blue mountains; lower-right corner is cracked.' } },
  }});
  await prisma.item.upsert({ where: { id: ids.foundKeys }, update: {}, create: {
    id: ids.foundKeys, type: ItemType.FOUND, status: ItemStatus.OPEN, category: ItemCategory.KEYS,
    title: 'Found key ring', publicDescription: 'Three keys on a plain ring found near Block C.', zone: 'BLOCK_C',
    occurredAt: new Date('2026-11-15T06:45:00.000Z'), reporterId: ids.finder, holdLocation: 'Security desk',
    embeddingStatus: EmbeddingStatus.FAILED,
    private: { create: { privateDetails: 'One brass key has a small triangle scratched into it.' } },
  }});
  await prisma.match.upsert({ where: { lostItemId_foundItemId: { lostItemId: ids.lostPhone, foundItemId: ids.foundPhone } }, update: {}, create: {
    id: ids.match, lostItemId: ids.lostPhone, foundItemId: ids.foundPhone, score: 0.91,
    breakdown: { semantic: 0.92, place: 1, time: 0.8 },
  }});
  await prisma.claim.upsert({ where: { id: ids.claim }, update: {}, create: {
    id: ids.claim, foundItemId: ids.foundPhone, lostItemId: ids.lostPhone, claimantId: ids.student,
    status: ClaimStatus.PENDING, prompts: [{ id: 'phone-wallpaper', text: 'Describe the lock-screen wallpaper.' }],
    answers: { 'phone-wallpaper': 'Blue mountains' }, proofScore: 0.88, trustScore: 81,
    breakdown: { proof: 0.88, timeline: 0.9, userTrust: 0.72, behaviour: 1 },
    submittedAt: new Date('2026-11-15T07:30:00.000Z'),
  }});
  await prisma.userBadge.upsert({ where: { userId_badge: { userId: ids.finder, badge: Badge.CAMPUS_HERO } }, update: {}, create: {
    userId: ids.finder, badge: Badge.CAMPUS_HERO,
  }});
  console.log('Seed complete: 3 users, 3 items, 1 match, and 1 pending claim.');
}

main().finally(() => prisma.$disconnect());
