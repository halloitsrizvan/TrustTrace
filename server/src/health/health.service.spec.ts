import type { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports an available database', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).resolves.toMatchObject({
      status: 'ok',
      db: 'ok',
    });
  });

  it('reports a database outage without throwing', async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error('down')) };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).resolves.toMatchObject({
      status: 'ok',
      db: 'down',
    });
  });
});
