import { MockEmbeddingProvider } from './mock-embedding.provider.js';

describe('MockEmbeddingProvider', () => {
  it('is deterministic, normalized, and preserves token similarity', async () => {
    const provider = new MockEmbeddingProvider(768);
    const first = await provider.embedText('black phone with a red case');
    const same = await provider.embedText('black phone with a red case');
    const similar = await provider.embedText('red case on a black phone');
    const cosine = first.reduce(
      (sum, value, index) => sum + value * similar[index]!,
      0,
    );
    const magnitude = Math.sqrt(first.reduce((sum, value) => sum + value ** 2, 0));

    expect(first).toEqual(same);
    expect(magnitude).toBeCloseTo(1, 10);
    expect(cosine).toBeGreaterThan(0.75);
  });
});
