import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/bootstrap.js';

describe('TrustTrace bootstrap (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  afterEach(async () => {
    await app.close();
  });
});
