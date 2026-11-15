import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimStatus } from '../../generated/prisma/enums.js';

export class ClaimResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) foundItemId: string;
  @ApiPropertyOptional({ format: 'uuid' }) lostItemId: string | null;
  @ApiProperty({ enum: ClaimStatus }) status: ClaimStatus;
  @ApiProperty({ type: Object, isArray: true }) prompts: object[];
  @ApiPropertyOptional({ type: Object, isArray: true }) answers: object[] | null;
  @ApiProperty() proofScore: number;
  @ApiProperty() trustScore: number;
  @ApiProperty({ type: Object }) breakdown: object;
  @ApiProperty() attemptNo: number;
  @ApiProperty({ format: 'date-time' }) startedAt: Date;
  @ApiPropertyOptional({ format: 'date-time' }) submittedAt: Date | null;
  @ApiPropertyOptional({ format: 'date-time' }) tokenExpiresAt: Date | null;
  @ApiPropertyOptional() decisionNote: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
}

export class QrResponseDto {
  @ApiProperty() token: string;
  @ApiProperty({ format: 'date-time' }) expiresAt: Date;
}
