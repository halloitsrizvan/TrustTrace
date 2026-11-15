# TrustTrace test handoff

## Start the release

Requirements: Docker Engine with Compose v2. From the repository root:

```sh
docker compose up --build
```

The first run builds the `trusttrace-client:test` and `trusttrace-server:test`
images, starts PostgreSQL with pgvector, applies migrations, and loads the
repeatable sample dataset. Open the web app at <http://localhost:3001>.
The API health endpoint is <http://localhost:3000/api/health> and Swagger is at
<http://localhost:3000/docs>.

To stop the services, run `docker compose down`. To remove the test database
and start from a clean seed on the next run, use `docker compose down -v`.

## Test accounts

All seeded accounts use password `Test@12345`.

| Role/scenario | Email | Intended checks |
| --- | --- | --- |
| Administrator | `admin@trusttrace.test` | Admin dashboard, pending claim review, audit pages, handover scan |
| Student/owner | `student@trusttrace.test` | Lost item, matched phone, submitted claim, tipping flow |
| Student/finder | `finder@trusttrace.test` | Found items, private proof protection, hero profile and wallet |

These credentials are test-only and must never be used in a production database.

## Seed coverage

The seed includes three users, a matched lost/found phone pair, an unmatched
found key ring, a 91% match, a pending claim with an answer, and a Campus Hero
badge. IDs and timestamps are deterministic so API assertions are stable. The
seed is safe to run repeatedly; it updates accounts and preserves existing
scenario records.

Photo uploads require real Cloudinary test-project credentials in the root
`.env`. All other core flows work with the checked-in mock embedding and mock
payment configuration and do not call external AI or payment services.

## Useful commands

```sh
docker compose ps
docker compose logs -f server client
docker compose run --rm migrate
docker image inspect trusttrace-client:test
docker image inspect trusttrace-server:test
```

For non-Docker development, copy `server/.env.example` to `server/.env` and
`client/.env.example` to `client/.env.local`, then follow each app README.
