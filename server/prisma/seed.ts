import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { ItemCategory, ItemType, Role } from '../src/generated/prisma/enums.js';
import { MockEmbeddingProvider } from '../src/embeddings/mock-embedding.provider.js';

const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error('DIRECT_URL is required to seed');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const embeddings = new MockEmbeddingProvider(Number(process.env.EMBEDDING_DIM ?? 768));

const users = [
  ['00000000-0000-4000-8000-000000000001', 'admin@demo.edu', 'Campus Admin', Role.ADMIN],
  ['00000000-0000-4000-8000-000000000002', 'alice@demo.edu', 'Alice Sharma', Role.STUDENT],
  ['00000000-0000-4000-8000-000000000003', 'mallory@demo.edu', 'Mallory Singh', Role.STUDENT],
  ['00000000-0000-4000-8000-000000000004', 'ravi@demo.edu', 'Ravi Kumar', Role.STUDENT],
  ['00000000-0000-4000-8000-000000000005', 'meera@demo.edu', 'Meera Nair', Role.STUDENT],
  ['00000000-0000-4000-8000-000000000006', 'kabir@demo.edu', 'Kabir Khan', Role.STUDENT],
  ['00000000-0000-4000-8000-000000000007', 'sana@demo.edu', 'Sana Patel', Role.STUDENT],
] as const;

const templates = [
  ['Black phone', ItemCategory.PHONE, 'Black smartphone in a transparent case near the library', 'red dragon sticker under case cracked top-left corner'],
  ['Found dark smartphone', ItemCategory.PHONE, 'Dark phone found beside the library return desk', 'red dragon sticker beneath clear case and cracked top-left corner'],
  ['Blue ID card', ItemCategory.ID_CARD, 'Student identity card with blue lanyard', 'surname Sharma and number ending 4821'],
  ['Calculus textbook', ItemCategory.BOOK, 'Thick calculus book with a green cover', 'Alice written on page three and yellow highlight page 42'],
  ['Silver earbuds', ItemCategory.GADGET, 'Wireless earbuds in a silver charging case', 'tiny moon sticker under lid'],
  ['Brown wallet', ItemCategory.WALLET, 'Small brown leather wallet', 'metro card and folded origami crane inside'],
  ['Brass keys', ItemCategory.KEYS, 'Set of three brass keys', 'blue robot keychain with missing arm'],
  ['Canvas backpack', ItemCategory.BAG, 'Grey canvas backpack with two pockets', 'orange notebook and chess club pin inside'],
] as const;
const zones = ['LIBRARY', 'ACADEMIC_BLOCK', 'CAFETERIA', 'HOSTELS', 'FEST_GROUNDS', 'AUDITORIUM'] as const;

async function main() {
  const passwordHash = await hash('DemoPass123!');
  for (const [id, email, name, role] of users) {
    await prisma.user.upsert({
      where: { id },
      update: { email, name, role },
      create: { id, email, name, role, passwordHash },
    });
  }

  for (let index = 0; index < 40; index += 1) {
    const [baseTitle, category, description, privateDetails] = templates[index % templates.length]!;
    const type = index % 2 === 0 ? ItemType.LOST : ItemType.FOUND;
    const id = `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    const reporterId = index === 0 ? users[1][0] : users[3 + (index % 4)]![0];
    const title = `${baseTitle} ${Math.floor(index / templates.length) + 1}`;
    const publicDescription = `${description}; report ${index + 1}`;
    const occurredAt = new Date(Date.now() - (index + 2) * 3_600_000);
    await prisma.item.upsert({
      where: { id },
      update: { title, publicDescription, zone: zones[index % zones.length], occurredAt },
      create: {
        id,
        type,
        category,
        title,
        publicDescription,
        zone: zones[index % zones.length],
        eventTag: index % 5 === 0 ? 'TechFest' : null,
        occurredAt,
        reporterId,
        holdLocation: type === ItemType.FOUND ? 'Campus security desk' : null,
        private: { create: { privateDetails } },
      },
    });
    await prisma.itemPrivate.upsert({
      where: { itemId: id },
      update: { privateDetails },
      create: { itemId: id, privateDetails },
    });
    const publicVector = JSON.stringify(await embeddings.embedText(`${title} ${category} ${publicDescription}`));
    const privateVector = JSON.stringify(await embeddings.embedText(privateDetails));
    await prisma.$executeRaw(Prisma.sql`UPDATE "Item" SET "publicEmbedding" = ${publicVector}::vector, "embeddingStatus" = 'READY'::"EmbeddingStatus" WHERE "id" = ${id}::uuid`);
    await prisma.$executeRaw(Prisma.sql`UPDATE "ItemPrivate" SET "privateEmbedding" = ${privateVector}::vector WHERE "itemId" = ${id}::uuid`);
  }

  console.log('TrustTrace demo seeded idempotently.');
  console.log('Admin: admin@demo.edu / DemoPass123!');
  console.log('Alice: alice@demo.edu / DemoPass123!');
  console.log('Mallory: mallory@demo.edu / DemoPass123!');
  console.log('Scenario: Mallory copies the public phone text and is rejected; Alice knows the red dragon sticker and cracked corner, receives a QR, and admin scans it.');
}

main().finally(() => prisma.$disconnect());
