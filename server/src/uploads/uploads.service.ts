import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { CurrentUser } from '../auth/auth.types.js';
import type {
  SignedUploadResponseDto,
  SignUploadDto,
} from './dto/sign-upload.dto.js';
import { MAX_UPLOAD_BYTES, SUPABASE_CLIENT } from './uploads.constants.js';

const EXTENSIONS: Record<SignUploadDto['contentType'], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  private readonly bucket: string;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    config: ConfigService,
  ) {
    this.bucket = config.getOrThrow<string>('SUPABASE_BUCKET');
  }

  async sign(
    user: CurrentUser,
    input: SignUploadDto,
  ): Promise<SignedUploadResponseDto> {
    const path = `${input.purpose}/${user.id}/${randomUUID()}.${EXTENSIONS[input.contentType]}`;
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data) {
      throw new ServiceUnavailableException('Unable to create upload URL');
    }

    return {
      signedUrl: data.signedUrl,
      path,
      token: data.token,
      maxBytes: MAX_UPLOAD_BYTES,
    };
  }
}
