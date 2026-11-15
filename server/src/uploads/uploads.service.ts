import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import type { CurrentUser } from '../auth/auth.types.js';
import type {
  SignedUploadResponseDto,
  SignUploadDto,
} from './dto/sign-upload.dto.js';
import { MAX_UPLOAD_BYTES } from './uploads.constants.js';

@Injectable()
export class UploadsService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: ConfigService) {
    this.cloudName = config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    this.apiKey = config.getOrThrow<string>('CLOUDINARY_API_KEY');
    this.apiSecret = config.getOrThrow<string>('CLOUDINARY_API_SECRET');
  }

  /**
   * Signs a direct browser upload to Cloudinary. The API secret never leaves the server:
   * the client only receives the signature. Private proof photos use the `authenticated`
   * delivery type, so they have no public URL.
   */
  sign(user: CurrentUser, input: SignUploadDto): SignedUploadResponseDto {
    const publicId = `${input.purpose}/${user.id}/${randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const params: Record<string, string | number> = {
      public_id: publicId,
      timestamp,
      ...(input.purpose === 'private' ? { type: 'authenticated' } : {}),
    };
    const toSign = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    const signature = createHash('sha1')
      .update(`${toSign}${this.apiSecret}`)
      .digest('hex');

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      fields: {
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, String(value)]),
        ),
        api_key: this.apiKey,
        signature,
      },
      path: publicId,
      publicUrl:
        input.purpose === 'public'
          ? `https://res.cloudinary.com/${this.cloudName}/image/upload/f_auto,q_auto/${publicId}`
          : null,
      maxBytes: MAX_UPLOAD_BYTES,
    };
  }
}
