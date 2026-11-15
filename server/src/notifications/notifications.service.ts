import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { NotificationQueryDto } from './dto/notification-query.dto.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: string,
    type: string,
    payload: Prisma.InputJsonValue,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, payload },
    });
  }

  async list(userId: string, query: NotificationQueryDto) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
    });
    const hasMore = rows.length > query.limit;
    const notifications = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      notifications,
      nextCursor: hasMore ? notifications.at(-1)!.id : null,
    };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Notification not found');
    return this.prisma.notification.findUniqueOrThrow({
      where: { id },
      select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
    });
  }
}
