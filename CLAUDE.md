# THE FORUM — Think. Write. Debate. Act.

Intellectual publishing & debate community (Pakistani university students first, international later).
English (LTR) + Urdu (RTL). Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · MongoDB Atlas.

> Next.js 16 differs from older versions: `middleware.ts` is now `src/proxy.ts`, `params`/`searchParams`/`cookies()` are async.
> Read `node_modules/next/dist/docs/` before using an unfamiliar API.

## Two sessions work in this folder at once

| Area | Owner | Paths |
|---|---|---|
| Frontend (UI, pages, i18n, mock data) | Frontend session | `src/app/[lang]/**`, `src/components/**`, `src/i18n/**`, `src/app/globals.css`, `src/lib/data/mock/**`, `src/lib/data/index.ts`, `src/lib/api/client.ts`, `src/proxy.ts`, `public/**`, `next.config.ts` |
| Backend (DB, auth, API) | Backend session | `src/server/**` (models, db connection, auth, services, `data/mongo-source.ts`), `src/app/api/**`, `scripts/**`, `.env.example` |
| Shared contract | Both — add fields freely, never rename/remove without updating consumers and noting it below | `src/types/domain.ts`, `src/lib/data/contract.ts`, `src/lib/api/contract.ts` |

Rules
- Never edit the other session's files. Need a change there? Note it under "Requests" below.
- Only the **backend** session runs `npm install` from now on (avoids two installs racing). Frontend asks via "Requests".
- Frontend dev server: `npm run dev` on port 3000 (`.next`). Backend test server: `NEXT_DIST_DIR=.next-backend npx next dev -p 3001`.
- Do not run `next build` while the other session's dev server may be running on `.next`; use `npx tsc --noEmit` to check types.
- No git repo yet: nobody commits.

## How the pieces connect
- **Reads**: pages call `getData()` from `@/lib/data` → returns a `DataSource` (`src/lib/data/contract.ts`). Mock today; `DATA_SOURCE=mongo` switches to `src/server/data/mongo-source.ts`.
- **Writes**: client components call `api("POST /api/…", body)` from `@/lib/api/client` against the endpoint map in `src/lib/api/contract.ts`. Unimplemented endpoints return `NOT_IMPLEMENTED` and the UI says "Prototype — not saved". Never fake success.
- **Seeding**: the mock fixtures in `src/lib/data/mock/fixtures/*.ts` are plain typed arrays the backend seed script can import.
- **Current user (server)**: `getData().getCurrentUser()`; backend implements it from the session cookie.

## Requests between sessions
_(append dated one-line notes here)_
- 2026-11-14 backend→frontend: Backend is in (see `docs/BACKEND.md`). All `ApiEndpoints` are live route handlers; until `MONGODB_URI` is set they return 501 → your "Prototype — not saved" path. `getData()` now switches on `DATA_SOURCE=mongo`.
- 2026-11-14 backend→frontend: With `DATA_SOURCE=mongo`, `listReports()`/`getAdminStats()` throw `AccessDeniedError` unless the viewer is moderator/admin — please gate `/[lang]/admin` on `getCurrentUser()` role (redirect/notFound) before calling them.
- 2026-11-14 backend→frontend: Added (contract) `POST /api/articles/:id/bookmark` → `{ bookmarks, bookmarked }` (toggle). Like/vote also toggle (vote: same value again removes it).
- 2026-11-14 backend→frontend: Plain-text fields (titles, comments, arguments, bios, discussion bodies) are stored as typed — render as text only, never `dangerouslySetInnerHTML`. Only Article.body, Debate.context, conclusion.body, Initiative.body are server-sanitised HTML.
- 2026-11-14 backend→frontend: Errors carry `error.fields` (zod field → message) for forms; 429 `RATE_LIMITED` on auth. Uploaded image URLs are relative `/api/uploads/…`. Debate `status` is computed from dates on the server.
- 2026-11-14 backend: added npm scripts (`db:indexes`, `db:seed`, `db:create-admin`, `dev:backend`) + deps (mongodb, zod, @node-rs/argon2, sanitize-html; dev: tsx, @types/sanitize-html); `.uploads/` added to .gitignore. `next dev` auto-added `.next-backend` type paths to tsconfig.json (harmless).
- 2026-11-22 backend→frontend: E2E on Atlas passed (103/103 write checks; all pages 200 in mongo mode, staff pages render for admin). One cleanup: signed-out GET /en/admin and /en/admin/reports still run the page in parallel with the layout's redirect, so `getAdminStats()`/`listReports()` throw AccessDeniedError into the server log (user still gets the 307; nothing leaks). Next renders layouts and pages concurrently — please also gate inside each admin page (e.g. a shared `requireStaffPage()` that calls getCurrentUser() + redirect) before calling those methods.
- 2026-11-22 backend→frontend: NEW AUTH (docs/BACKEND.md §4/§11; contract updated, additions only). (1) New accounts get `emailVerified:false` + a 6-digit emailed code; all writes except PATCH /api/users/me answer 403 `EMAIL_UNVERIFIED` until `POST /api/auth/verify-email {code}`. Please add a verify screen (after register, and whenever a write returns EMAIL_UNVERIFIED) with "Resend code" → `POST /api/auth/resend-verification` (429 + Retry-After within 60 s; `delivery:"dev-console"` means SMTP isn't set — say the code is in the server log, dev only). (2) "Forgot password?" on login (currently plain text) → page using `POST /api/auth/forgot-password {email}` then `POST /api/auth/reset-password {email, code, password}` (signs in). (3) "Continue with Google" on login + register: a plain link `<a href="/api/auth/google?next=…&lang=…">` (NOT api()); show it only when `GET /api/auth/providers` → `google:true`; login page should show messages for `?error=` values of type `GoogleAuthError` (google_unavailable, google_cancelled, google_failed, google_unverified_email, suspended). Google avatars are https://lh3.googleusercontent.com/… — add that host to images.remotePatterns if you use next/image.
