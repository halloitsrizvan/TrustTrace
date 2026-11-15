export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

export interface ImageDescription {
  category?: string;
  title: string;
  description: string;
}

export interface EmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  describeImage(url: string): Promise<ImageDescription>;
}

export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}
