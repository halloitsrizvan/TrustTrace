import { ConfigService } from '@nestjs/config';
import { Role } from '../generated/prisma/enums.js';
import { MAX_UPLOAD_BYTES } from './uploads.constants.js';
import { UploadsService } from './uploads.service.js';

describe('UploadsService', () => {
  it('creates an isolated private path without exposing credentials', async () => {
    const createSignedUploadUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.test/upload', token: 'upload-token' },
      error: null,
    });
    const client = {
      storage: { from: vi.fn(() => ({ createSignedUploadUrl })) },
    };
    const config = new ConfigService({ SUPABASE_BUCKET: 'images' });
    const service = new UploadsService(client as never, config);
    const user = {
      id: '8db7b2bb-f6e4-4b94-b67b-48f891a51ec0',
      email: 'alice@demo.edu',
      name: 'Alice',
      role: Role.STUDENT,
      trustScore: 50,
    };

    const result = await service.sign(user, {
      contentType: 'image/png',
      purpose: 'private',
    });

    expect(result.path).toMatch(
      /^private\/8db7b2bb-f6e4-4b94-b67b-48f891a51ec0\/[\w-]+\.png$/,
    );
    expect(result.maxBytes).toBe(MAX_UPLOAD_BYTES);
    expect(result).not.toHaveProperty('serviceRoleKey');
    expect(createSignedUploadUrl).toHaveBeenCalledWith(result.path, {
      upsert: false,
    });
  });
});
