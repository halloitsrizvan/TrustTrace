import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class AdminAuditQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) entity?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() cursor?: string;
  @ApiPropertyOptional({ default: 50, maximum: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}
