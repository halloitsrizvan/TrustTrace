import { createHash } from 'node:crypto';
import type { EmbeddingProvider, ImageDescription } from './embedding-provider.js';
import { normalizeVector } from './embedding-provider.js';

export class MockEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly dimension: number) {}

  async embedText(text: string): Promise<number[]> {
    const vector = Array.from<number>({ length: this.dimension }).fill(0);
    const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    for (const token of tokens) {
      const digest = createHash('sha256').update(token).digest();
      const index = digest.readUInt32BE(0) % this.dimension;
      vector[index] += digest[4]! % 2 === 0 ? 1 : -1;
    }
    return normalizeVector(vector);
  }

  async describeImage(_url: string): Promise<ImageDescription> {
    return {
      title: 'Uploaded item image',
      description: 'An uploaded image is available for visual comparison.',
    };
  }
}
