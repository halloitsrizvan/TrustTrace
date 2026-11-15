import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty() signedUrl: string;
  @ApiProperty({ example: 'public/user-id/random-id.jpg' }) path: string;
  @ApiProperty({ description: 'Supabase upload token' }) token: string;
  @ApiProperty({ example: 5_242_880 }) maxBytes: number;
}
