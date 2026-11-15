import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { TipStatus } from '../../generated/prisma/enums.js';

export class AdminTipsQueryDto {
  @ApiPropertyOptional({ enum: TipStatus }) @IsOptional() @IsEnum(TipStatus) status?: TipStatus;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() cursor?: string;
  @ApiPropertyOptional({ default: 50, maximum: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}
