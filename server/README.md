# TrustTrace API

NestJS 12 API for the TrustTrace campus lost-and-found platform. It implements
the report → match → blind claim → trust score → QR handover → returned loop.

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

Major route groups are `/api/auth`, `/api/uploads`, `/api/items`, `/api/claims`,
`/api/handover`, `/api/notifications`, and `/api/admin`. Public routes are the
health check and item feed/detail. All other routes require a bearer JWT;
handover and admin routes additionally require the `ADMIN` role.

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

Configure the Supabase Storage bucket itself to allow only JPEG, PNG, and WebP
objects up to 5 MB. Public uploads use `public/{userId}/...`; private proof uses
`private/{userId}/...` and is never included in public responses.

## Matching and trust scoring

Matching uses the same category as a hard filter, then up to 20 cosine-nearest
pgvector candidates. When embeddings are unavailable it maps lexical token
Jaccard into the semantic signal. The final score is:

`0.60 × semantic + 0.25 × place + 0.15 × time`

Matches are stored from 0.45 and notifications are sent from 0.60. Semantic
similarity has a 0.50 cosine floor. Zone adjacency and every constant live in
`src/scoring/scoring.config.ts`.

Claim trust is:

`100 × (0.55 × proof + 0.20 × timeline + 0.15 × userTrust + 0.10 × behaviour)`

Proof combines semantic similarity (70%) and recall of private-only tokens
(30%). Proof below 0.35 always rejects. Normal auto-approval starts at 70;
phones, gadgets, ID cards, and wallets require 75. Public-text copycats with no
private-token recall are rejected and lose trust.

Static, category-specific blind prompts are intentionally used for the current
demo. They are the specified reliable fallback and keep claim creation
available when an LLM is offline. Collection duration in admin statistics uses
`Claim.updatedAt - Item.createdAt`, because the original data model has no
dedicated `collectedAt` column.


## Verification

```powershell
npm run build
npm test
npm run test:e2e
npm run lint
```

The default e2e suite uses a deliberately unavailable local database address to
verify outage behavior and API serialization without requiring developer
credentials. Database-backed demo verification requires a migrated Supabase or
local PostgreSQL/pgvector database configured through `.env`.

## Optional tipping and recognition

Tips are available only after a claim reaches `COLLECTED`, never during
matching or proof verification. Claim scoring imports no tipping or karma data.
All money uses integer paise and wallet balances are derived from the immutable
`WalletEntry` ledger.

The buildathon configuration uses `PAYMENT_PROVIDER=mock`. An owner creates an
idempotent order with `POST /api/tips` and confirms it with
`POST /api/tips/{id}/confirm`. Razorpay and withdrawals are intentionally
excluded. Defaults in `src/tipping/tipping.config.ts` are:

- ₹10 minimum, ₹500 maximum, ₹1,000 daily cap
- suggested amounts ₹20, ₹50, and ₹100
- seven-day post-collection window
- 30-minute pending-order TTL (the expiry worker is deferred with the cut
  webhook/provider slice)
- finder return +20 karma; finder/tipper successful-tip +5 karma
- same finder/claimant pair earns karma at most once per 30 days

Anonymous received-tip responses omit both `tipperId` and the tipper object.
Stored `TIP_RECEIVED` notification payloads likewise contain no tipper identity.
Public profiles and the Campus Heroes leaderboard expose names, karma, badges,
and return counts—never email addresses or monetary amounts.
