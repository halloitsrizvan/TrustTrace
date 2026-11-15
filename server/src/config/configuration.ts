export interface AppConfiguration {
  port: number;
  corsOrigins: string[];
  embeddingDimension: number;
}

export const configuration = (): AppConfiguration => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  embeddingDimension: Number.parseInt(process.env.EMBEDDING_DIM ?? '768', 10),
});
