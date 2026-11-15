import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/bootstrap.js';
import { ItemsService } from '../src/items/items.service.js';

const forbiddenPublicKeys = new Set([
  'privateDetails',
  'privateEmbedding',
  'privateImageUrl',
  'tokenHash',
]);

function expectNoPrivateKeys(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    expect(forbiddenPublicKeys.has(key)).toBe(false);
    expectNoPrivateKeys(child);
  }
}

describe('TrustTrace bootstrap (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ItemsService)
      .useValue({
        feed: vi.fn().mockResolvedValue({
          items: [
            {
              id: '32bf3b78-a847-4753-8fa9-b74a7508997a',
              type: 'FOUND',
              status: 'OPEN',
              category: 'PHONE',
              title: 'Found phone',
              publicDescription: 'Found near the main library entrance',
              zone: 'LIBRARY',
              eventTag: null,
              occurredAt: '2026-11-15T10:00:00.000Z',
              imageUrl: null,
              reporterId: '1d52105d-516b-43d9-90dd-7b404add3f1e',
              holdLocation: 'Campus desk',
              embeddingStatus: 'PENDING',
              createdAt: '2026-11-15T10:00:00.000Z',
              updatedAt: '2026-11-15T10:00:00.000Z',
              reporter: {
                id: '1d52105d-516b-43d9-90dd-7b404add3f1e',
                name: 'Finder',
              },
            },
          ],
          nextCursor: null,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it('exposes database-aware health without failing the API', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok', db: 'down' });
    expect(new Date(response.body.time).toString()).not.toBe('Invalid Date');
  });

  it('publishes the OpenAPI document outside the API prefix', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(response.body.info.title).toBe('TrustTrace API');
    expect(response.body.paths['/api/health']).toBeDefined();
  });

  it('uses the safe global error response shape', async () => {
    await request(app.getHttpServer()).get('/api/missing').expect(404, {
      statusCode: 404,
      message: 'Cannot GET /api/missing',
      error: 'Not Found',
    });
  });

  it('never leaks private fields through public item responses', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/items')
      .expect(200);
    expectNoPrivateKeys(response.body);
  });

  afterEach(async () => {
    await app.close();
  });
});
