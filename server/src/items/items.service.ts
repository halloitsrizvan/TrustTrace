import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CurrentUser } from '../auth/auth.types.js';
import { ItemStatus, ItemType } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmbeddingsService } from '../embeddings/embeddings.service.js';
import { MatchingService } from '../matching/matching.service.js';
import type { CreateItemDto } from './dto/create-item.dto.js';
import type { ItemQueryDto } from './dto/item-query.dto.js';
import type {
  CreateItemResponseDto,
  ItemPageResponseDto,
  OwnerItemResponseDto,
  PublicItemResponseDto,
} from './dto/item-response.dto.js';

type ItemWithRelations = Prisma.ItemGetPayload<{
  include: { reporter: { select: { id: true; name: true } }; private: true };
}>;

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
    private readonly matching: MatchingService,
  ) {}

  async create(
    user: CurrentUser,
    input: CreateItemDto,
  ): Promise<CreateItemResponseDto> {
    const occurredAt = new Date(input.occurredAt);
    if (occurredAt.getTime() > Date.now()) {
      throw new BadRequestException('occurredAt must not be in the future');
    }
    if (input.type === ItemType.FOUND && !input.privateDetails) {
      throw new BadRequestException(
        'FOUND items require privateDetails of at least 10 characters',
      );
    }

    const item = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.item.create({
        data: {
          type: input.type,
          category: input.category,
          title: input.title.trim(),
          publicDescription: input.publicDescription.trim(),
          zone: input.zone,
          eventTag: input.eventTag?.trim() || null,
          occurredAt,
          imageUrl: input.imageUrl ?? null,
          reporterId: user.id,
          holdLocation: input.holdLocation?.trim() || null,
          private: {
            create: {
              privateDetails: input.privateDetails?.trim() || null,
              privateImageUrl: input.privateImageUrl ?? null,
            },
          },
        },
        include: {
          reporter: { select: { id: true, name: true } },
          private: true,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: 'ITEM_CREATED',
          entity: 'Item',
          entityId: created.id,
          meta: { type: created.type, category: created.category },
        },
      });
      return created;
    });

    await this.embeddings.processItem(item.id);
    const matches = await this.matching.runForItem(item.id);
    const refreshed = await this.prisma.item.findUniqueOrThrow({
      where: { id: item.id },
      include: {
        reporter: { select: { id: true, name: true } },
        private: true,
      },
    });
    return Object.assign(this.toOwner(refreshed), { matches });
  }

  async feed(query: ItemQueryDto): Promise<ItemPageResponseDto> {
    const where: Prisma.ItemWhereInput = {
      type: query.type,
      category: query.category,
      zone: query.zone,
      status: query.status,
      eventTag: query.eventTag
        ? { equals: query.eventTag, mode: 'insensitive' }
        : undefined,
      OR: query.q
        ? [
            { title: { contains: query.q, mode: 'insensitive' } },
            {
              publicDescription: {
                contains: query.q,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
    const rows = await this.prisma.item.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { reporter: { select: { id: true, name: true } } },
    });
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      items: page.map((item) => this.toPublic(item)),
      nextCursor: hasMore ? page.at(-1)!.id : null,
    };
  }

  async mine(user: CurrentUser): Promise<OwnerItemResponseDto[]> {
    const items = await this.prisma.item.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true } },
        private: true,
      },
    });
    return items.map((item) => this.toOwner(item));
  }

  async findOne(
    id: string,
    user?: CurrentUser | null,
  ): Promise<PublicItemResponseDto | OwnerItemResponseDto> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true } },
        private: true,
      },
    });
    if (!item) throw new NotFoundException('Item not found');
    return user?.id === item.reporterId
      ? this.toOwner(item)
      : this.toPublic(item);
  }

  async close(id: string, user: CurrentUser): Promise<OwnerItemResponseDto> {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item not found');
    if (existing.reporterId !== user.id) {
      throw new ForbiddenException('Only the reporter can close this item');
    }
    const item = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.item.update({
        where: { id },
        data: { status: ItemStatus.CLOSED },
        include: {
          reporter: { select: { id: true, name: true } },
          private: true,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: 'ITEM_CLOSED',
          entity: 'Item',
          entityId: id,
          meta: {},
        },
      });
      return updated;
    });
    return this.toOwner(item);
  }

  toPublic(item: Omit<ItemWithRelations, 'private'> & { private?: unknown }): PublicItemResponseDto {
    return {
      id: item.id,
      type: item.type,
      status: item.status,
      category: item.category,
      title: item.title,
      publicDescription: item.publicDescription,
      zone: item.zone,
      eventTag: item.eventTag,
      occurredAt: item.occurredAt,
      imageUrl: item.imageUrl,
      reporterId: item.reporterId,
      holdLocation: item.holdLocation,
      embeddingStatus: item.embeddingStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      reporter: item.reporter,
    };
  }

  private toOwner(item: ItemWithRelations): OwnerItemResponseDto {
    return Object.assign(this.toPublic(item), {
      private: {
        privateDetails: item.private?.privateDetails ?? null,
        privateImageUrl: item.private?.privateImageUrl ?? null,
      },
    });
  }
}
