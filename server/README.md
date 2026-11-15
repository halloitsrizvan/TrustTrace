# TrustTrace API

NestJS 12 API for the TrustTrace campus lost-and-found platform. This initial
server slice includes validated configuration, Prisma/PostgreSQL with pgvector,
security middleware, request throttling, OpenAPI, and database-aware health.

## Requirements

- Node.js 22.22.3 or newer (or Node.js 24.15+)
- npm
- PostgreSQL/Supabase project with permission to enable `vector`

## Setup

```powershell
Copy-Item .env.example .env
npm install --legacy-peer-deps
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Fill every value in `.env` before starting. Use the pooled Supabase connection
for `DATABASE_URL` (including `?pgbouncer=true`) and the direct connection for
`DIRECT_URL`. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be sent
to a client.

The dependency installation currently needs npm's legacy peer resolver because
npm 10.9 can crash while resolving Vitest's optional peer graph.

## Routes

- API base: `http://localhost:3000/api`
- Health: `GET /api/health`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

Health returns `status: "ok"` for a live API and independently reports the
database as `ok` or `down`.

## Database

The initial migration creates all product enums and tables, enables pgvector,
and adds HNSW cosine indexes to the 768-dimensional public and private vector
columns.

```powershell
npm run prisma:generate
npm run prisma:migrate:dev
```

Do not change `EMBEDDING_DIM` after vectors have been stored without performing
a coordinated model and database migration.

## Verification

```powershell
npm run build
npm test
npm run test:e2e
npm run lint
```

The e2e tests use a deliberately unavailable local database address to verify
that health remains responsive and reports `db: "down"` during an outage.
