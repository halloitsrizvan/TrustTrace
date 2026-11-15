import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class StartClaimDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() foundItemId: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() lostItemId?: string;
}

export class ClaimPromptDto {
  @ApiProperty() id: string;
  @ApiProperty() text: string;
}

export class StartClaimResponseDto {
  @ApiProperty({ format: 'uuid' }) claimId: string;
  @ApiProperty({ type: [ClaimPromptDto] }) prompts: ClaimPromptDto[];
}
