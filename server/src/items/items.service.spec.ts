import {
  EmbeddingStatus,
  ItemCategory,
  ItemStatus,
  ItemType,
} from '../generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ItemsService } from './items.service.js';

const FORBIDDEN_PUBLIC_KEYS = new Set([
  'privateDetails',
  'privateEmbedding',
  'privateImageUrl',
  'tokenHash',
]);

function assertNoPrivateKeys(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    expect(FORBIDDEN_PUBLIC_KEYS.has(key)).toBe(false);
    assertNoPrivateKeys(child);
  }
}

describe('ItemsService response mapping', () => {
  const service = new ItemsService({} as PrismaService);

  it('allow-lists public fields even when the source contains private data', () => {
    const now = new Date();
    const source = {
      id: 'f1df62bf-3a16-45f9-88b5-6f12a4bfae70',
      type: ItemType.FOUND,
      status: ItemStatus.OPEN,
      category: ItemCategory.PHONE,
      title: 'Black phone',
      publicDescription: 'Black phone found near the library entrance',
      zone: 'LIBRARY',
      eventTag: null,
      occurredAt: now,
      imageUrl: null,
      reporterId: '707b023a-1dc4-441f-be9d-764270781137',
      holdLocation: 'Campus desk',
      embeddingStatus: EmbeddingStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      reporter: {
        id: '707b023a-1dc4-441f-be9d-764270781137',
        name: 'Finder',
      },
      private: {
        privateDetails: 'A red sticker under the transparent case',
        privateImageUrl: 'private/secret.webp',
        privateEmbedding: [1, 2, 3],
      },
      tokenHash: 'must-not-leak',
    };

    const response = service.toPublic(source as never);
    assertNoPrivateKeys(response);
    expect(response).not.toHaveProperty('private');
  });
});
