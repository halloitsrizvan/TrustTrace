import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthResponseDto } from './health.dto.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponseDto> {
    let db: 'ok' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'ok';
    } catch {
      // Health remains available while the database is unavailable.
    }

    return { status: 'ok', db, time: new Date().toISOString() };
  }
}
