import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ItemCategory, ItemType } from '../../generated/prisma/enums.js';
import { CAMPUS_ZONES } from '../items.config.js';

export class CreateItemDto {
  @ApiProperty({ enum: ItemType })
  @IsEnum(ItemType)
  type: ItemType;

  @ApiProperty({ enum: ItemCategory })
  @IsEnum(ItemCategory)
  category: ItemCategory;

  @ApiProperty({ minLength: 3, maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiProperty({ minLength: 10, maxLength: 1_500 })
  @IsString()
  @MinLength(10)
  @MaxLength(1_500)
  publicDescription: string;

  @ApiProperty({ enum: CAMPUS_ZONES })
  @IsIn(CAMPUS_ZONES)
  zone: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventTag?: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  occurredAt: string;

  @ApiPropertyOptional({ format: 'uri' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional({ minLength: 10, maxLength: 2_000 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2_000)
  privateDetails?: string;

  @ApiPropertyOptional({ description: 'Private Supabase Storage object path' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  privateImageUrl?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  holdLocation?: string;
}
