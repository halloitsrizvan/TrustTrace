process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:1/trusttrace?pgbouncer=true';
process.env.DIRECT_URL =
  'postgresql://postgres:postgres@127.0.0.1:1/trusttrace';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-at-least-20-chars';
process.env.SUPABASE_BUCKET = 'test-images';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CORS_ORIGINS = 'http://localhost:3001';
process.env.EMBEDDING_PROVIDER = 'mock';
process.env.EMBEDDING_API_KEY = '';
process.env.EMBEDDING_MODEL = 'mock-embedding';
process.env.VISION_MODEL = 'mock-vision';
process.env.EMBEDDING_DIM = '768';
process.env.PORT = '3000';
