import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { IMAGE_CONTENT_TYPES } from '../uploads.constants.js';

export class SignUploadDto {
  @ApiProperty({ enum: IMAGE_CONTENT_TYPES, example: 'image/jpeg' })
  @IsIn(IMAGE_CONTENT_TYPES)
  contentType: (typeof IMAGE_CONTENT_TYPES)[number];

  @ApiProperty({ enum: ['public', 'private'] })
  @IsIn(['public', 'private'])
  purpose: 'public' | 'private';
}

export class SignedUploadResponseDto {
  @ApiProperty({ description: 'POST multipart form data here' })
  uploadUrl: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Form fields to send before the file field',
  })
  fields: Record<string, string>;

  @ApiProperty({ example: 'public/user-id/random-id' }) path: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Delivery URL for public uploads; null for private ones',
  })
  publicUrl: string | null;

  @ApiProperty({ example: 5_242_880 }) maxBytes: number;
}
