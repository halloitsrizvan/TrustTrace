import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ClaimStatus } from '../../generated/prisma/enums.js';

export class AdminClaimsQueryDto {
  @ApiPropertyOptional({ enum: ClaimStatus }) @IsOptional() @IsEnum(ClaimStatus) status?: ClaimStatus;
}

export class AdminDecisionDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] }) @IsIn(['APPROVE', 'REJECT']) decision: 'APPROVE' | 'REJECT';
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}
