import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmbeddingStatus,
  ItemCategory,
  ItemStatus,
  ItemType,
} from '../../generated/prisma/enums.js';

export class ReporterSummaryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
}

export class PublicItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: ItemType }) type: ItemType;
  @ApiProperty({ enum: ItemStatus }) status: ItemStatus;
  @ApiProperty({ enum: ItemCategory }) category: ItemCategory;
  @ApiProperty() title: string;
  @ApiProperty() publicDescription: string;
  @ApiProperty() zone: string;
  @ApiPropertyOptional() eventTag: string | null;
  @ApiProperty({ format: 'date-time' }) occurredAt: Date;
  @ApiPropertyOptional() imageUrl: string | null;
  @ApiProperty({ format: 'uuid' }) reporterId: string;
  @ApiPropertyOptional() holdLocation: string | null;
  @ApiProperty({ enum: EmbeddingStatus }) embeddingStatus: EmbeddingStatus;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;
  @ApiProperty({ type: ReporterSummaryDto }) reporter: ReporterSummaryDto;
}

export class PrivateItemFieldsDto {
  @ApiPropertyOptional() privateDetails: string | null;
  @ApiPropertyOptional() privateImageUrl: string | null;
}

export class OwnerItemResponseDto extends PublicItemResponseDto {
  @ApiProperty({ type: PrivateItemFieldsDto }) private: PrivateItemFieldsDto;
}

export class ItemPageResponseDto {
  @ApiProperty({ type: [PublicItemResponseDto] }) items: PublicItemResponseDto[];
  @ApiPropertyOptional({ format: 'uuid' }) nextCursor: string | null;
}

export class CreateItemResponseDto extends OwnerItemResponseDto {
  @ApiProperty({
    type: Object,
    isArray: true,
    description: 'Populated by the matching slice',
  })
  matches: unknown[];
}
