# TrustTrace project context

TrustTrace is a campus lost-and-found platform built as a Next.js client and a
NestJS API. The API lives in `server/` and uses Prisma, PostgreSQL on Supabase,
pgvector, JWT authentication, Supabase Storage, and provider-agnostic text
embeddings.

The product loop is:

1. A student reports a lost or found item.
2. Public item details are matched semantically and by place/time.
3. A claimant answers blind prompts derived from private finder-only proof.
4. The API calculates a trust score and approves, flags, or rejects the claim.
5. Approved claims receive a single-use handover token scanned by an admin.
6. The item is marked returned and every state transition is audit logged.

## Non-negotiable constraints

- Private proof and private images never appear in public API responses.
- Secrets remain server-side and `.env` is never committed.
- Vector dimensions remain fixed at 768 unless the schema and model are migrated
  together.
- All state changes are transactional where competing claims are possible.
- External embedding/vision calls always have deterministic fallbacks.
- The server API prefix is `/api`; Swagger UI is `/docs` and JSON is
  `/docs-json`.

The full implementation brief supplied by the user is tracked in the
conversation attachment. This folder holds durable, concise context for agents
and contributors working in the repository.
