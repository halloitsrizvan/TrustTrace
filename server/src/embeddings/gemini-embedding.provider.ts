import { ServiceUnavailableException } from '@nestjs/common';
import type { EmbeddingProvider, ImageDescription } from './embedding-provider.js';
import { normalizeVector } from './embedding-provider.js';

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly embeddingModel: string,
    private readonly visionModel: string,
    private readonly dimension: number,
  ) {}

  async embedText(text: string): Promise<number[]> {
    const response = await this.request(
      this.embeddingModel,
      'embedContent',
      {
        content: { parts: [{ text }] },
        output_dimensionality: this.dimension,
      },
    );
    const values = (response as { embedding?: { values?: number[] } }).embedding
      ?.values;
    if (!values || values.length !== this.dimension) {
      throw new ServiceUnavailableException('Embedding provider returned an invalid vector');
    }
    return normalizeVector(values);
  }

  async describeImage(url: string): Promise<ImageDescription> {
    const imageResponse = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!imageResponse.ok) throw new Error('Unable to fetch item image');
    const mimeType = imageResponse.headers.get('content-type') ?? 'image/jpeg';
    const data = Buffer.from(await imageResponse.arrayBuffer()).toString('base64');
    const response = await this.request(this.visionModel, 'generateContent', {
      contents: [
        {
          parts: [
            { text: 'Describe this lost-and-found item as JSON with title, description, and optional category.' },
            { inline_data: { mime_type: mimeType, data } },
          ],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const text = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
      .candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Vision provider returned no description');
    return JSON.parse(text) as ImageDescription;
  }

  private async request(model: string, action: string, body: unknown): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${action}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8_000),
          },
        );
        if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw new ServiceUnavailableException('Embedding provider unavailable', {
      cause: lastError,
    });
  }
}
