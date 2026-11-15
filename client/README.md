# TrustTrace web

Next.js (App Router) + TypeScript + Tailwind v4 frontend for the TrustTrace campus lost-and-found platform.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

| Env | Purpose |
| --- | --- |
| `API_URL` | Server only. Backend base URL including `/api`. |
| `NEXT_PUBLIC_MOCK_PAYMENT` | `1` confirms tips right after creating them (`POST /tips/:id/confirm`). |
| `NEXT_PUBLIC_IMAGE_HOST` | Image host for `next/image` remotePatterns (`res.cloudinary.com`). |

## Auth
No token in localStorage. `POST /api/auth/login` calls the backend and sets the JWT in an httpOnly, sameSite=lax cookie. The browser only talks to `/api/proxy/[...path]`, which adds the bearer token. `src/proxy.ts` (Next 16 name for middleware) redirects signed-out visitors from protected routes; the admin layout checks `role` from `GET /auth/me`.

## API types
`npm run gen:api` runs `openapi-typescript "$API_URL/docs-json" -o src/lib/api/schema.d.ts`. App code uses the hand-kept domain types in `src/lib/api/types.ts`, written from the contract summary. Where Swagger differs, Swagger wins; compare after regenerating.
Known differences at the time of writing: the backend returns `{ accessToken, user }` from login (the BFF strips the token); item matches, claims, tips and admin endpoints were not in the backend yet, so their shapes follow the brief.

## Design tokens
Defined as CSS variables in `src/app/globals.css` (light and `.dark`), mapped to Tailwind colors in `@theme inline`. Fonts: Archivo (width axis), Atkinson Hyperlegible, Noto Sans Malayalam. Preview every signature component at `/design`. All UI strings are in `src/lib/copy.ts`.

## Scripts
`npm run build`, `npm run lint`, `npm run typecheck`.
