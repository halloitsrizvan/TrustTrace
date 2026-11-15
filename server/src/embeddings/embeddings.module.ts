import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMBEDDING_PROVIDER } from './embedding-provider.js';
import { EmbeddingsService } from './embeddings.service.js';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider.js';
import { MockEmbeddingProvider } from './mock-embedding.provider.js';

@Global()
@Module({
  providers: [
    {
      provide: EMBEDDING_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dimension = config.getOrThrow<number>('embeddingDimension');
        if (config.getOrThrow<string>('EMBEDDING_PROVIDER') === 'mock') {
          return new MockEmbeddingProvider(dimension);
        }
        return new GeminiEmbeddingProvider(
          config.getOrThrow<string>('EMBEDDING_API_KEY'),
          config.getOrThrow<string>('EMBEDDING_MODEL'),
          config.getOrThrow<string>('VISION_MODEL'),
          dimension,
        );
      },
    },
    EmbeddingsService,
  ],
  exports: [EMBEDDING_PROVIDER, EmbeddingsService],
})
export class EmbeddingsModule {}
