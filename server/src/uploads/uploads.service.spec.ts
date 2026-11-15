import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Role } from '../generated/prisma/enums.js';
import { MAX_UPLOAD_BYTES } from './uploads.constants.js';
import { UploadsService } from './uploads.service.js';

describe('UploadsService', () => {
  const config = new ConfigService({
    CLOUDINARY_CLOUD_NAME: 'demo-cloud',
    CLOUDINARY_API_KEY: '12345',
    CLOUDINARY_API_SECRET: 'top-secret',
  });
  const user = {
    id: '8db7b2bb-f6e4-4b94-b67b-48f891a51ec0',
    email: 'alice@demo.edu',
    name: 'Alice',
    role: Role.STUDENT,
    trustScore: 50,
  };

  it('signs a private upload without exposing the secret or a public URL', () => {
    const result = new UploadsService(config).sign(user, {
      contentType: 'image/png',
      purpose: 'private',
    });

    expect(result.path).toMatch(
      /^private\/8db7b2bb-f6e4-4b94-b67b-48f891a51ec0\/[\w-]+$/,
    );
    expect(result.fields.type).toBe('authenticated');
    expect(result.publicUrl).toBeNull();
    expect(result.maxBytes).toBe(MAX_UPLOAD_BYTES);
    expect(JSON.stringify(result)).not.toContain('top-secret');
  });

  it('produces a valid Cloudinary signature for a public upload', () => {
    const result = new UploadsService(config).sign(user, {
      contentType: 'image/jpeg',
      purpose: 'public',
    });
    const { signature, api_key: apiKey, ...signed } = result.fields;
    const toSign = Object.keys(signed)
      .sort()
      .map((key) => `${key}=${signed[key]}`)
      .join('&');

    expect(apiKey).toBe('12345');
    expect(signature).toBe(
      createHash('sha1').update(`${toSign}top-secret`).digest('hex'),
    );
    expect(result.uploadUrl).toBe(
      'https://api.cloudinary.com/v1_1/demo-cloud/image/upload',
    );
    expect(result.publicUrl).toContain('res.cloudinary.com/demo-cloud/');
  });
});
