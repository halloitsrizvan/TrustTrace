# Release notes

## Test build — 2026-11-15

### Features

- Campus lost-and-found reporting for lost and found items with public and
  private proof details.
- Category, location, time, and semantic matching with user notifications.
- Blind proof claim flow, trust scoring, admin review, and QR handover.
- Student activity, public hero profiles, badges, karma, tips, and wallet view.
- Role-protected student and administrator interfaces with responsive/PWA
  metadata and dark-mode support.
- Swagger API documentation and database-aware health reporting.

### Test packaging

- Added production-style frontend and backend Docker images.
- Added a Compose stack with PostgreSQL/pgvector, automated migrations, health
  checks, and deterministic seed data.
- Added environment templates and documented accounts for student, finder, and
  administrator role testing.
- External embeddings and payments default to deterministic mock providers.

### Known limitations

- Image upload testing needs credentials for a Cloudinary test project.
- Razorpay and withdrawals are not included; the test build uses mock payment
  confirmation.
- Blind prompts are category-specific static prompts in this build.
- Seeded item images are intentionally absent, so the UI exercises its image
  placeholder states.
