import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { TIPPING_CONFIG } from '../tipping.config.js';

export class CreateTipDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() claimId: string;
  @ApiProperty({ minimum: TIPPING_CONFIG.minTipMinor, maximum: TIPPING_CONFIG.maxTipMinor })
  @IsInt() @Min(TIPPING_CONFIG.minTipMinor) @Max(TIPPING_CONFIG.maxTipMinor) amountMinor: number;
  @ApiPropertyOptional({ maxLength: 140 }) @IsOptional() @IsString() @MaxLength(140) message?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() anonymous = false;
}
