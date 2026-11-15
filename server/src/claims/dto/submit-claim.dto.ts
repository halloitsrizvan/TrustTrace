import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ClaimStatus } from '../../generated/prisma/enums.js';

export class ClaimAnswerDto {
  @ApiProperty() @IsString() promptId: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(500) text: string;
}

export class SubmitClaimDto {
  @ApiProperty({ type: [ClaimAnswerDto] })
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => ClaimAnswerDto)
  answers: ClaimAnswerDto[];
}

export class SubmitClaimResponseDto {
  @ApiProperty({ enum: [ClaimStatus.APPROVED, ClaimStatus.FLAGGED, ClaimStatus.REJECTED] })
  decision: ClaimStatus;
  @ApiProperty() trustScore: number;
  @ApiProperty({ type: Object }) breakdown: object;
  @ApiPropertyOptional() handoverToken?: string;
}
