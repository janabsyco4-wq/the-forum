# THE FORUM — Backend

MongoDB Atlas + Next.js 16 Route Handlers. Everything server-side lives in `src/server/**`; HTTP endpoints in `src/app/api/**`; scripts in `scripts/**`.

> **Status (2026-11-22):** Atlas is connected and indexed. The database is empty except your admin `@shehrooz` and the 10 categories. Every write endpoint passed an end-to-end run against Atlas (103/103 checks). Email verification, password reset and Google sign-in are built and tested (38/38). They still need **your** Gmail App Password and Google OAuth client in `.env.local`; see §11.

---

## 1. Setup

1. **Atlas**: create a cluster, add a database user with `readWrite` on `the_forum`, and allow your IP under Network Access.
2. **Env**: copy `.env.example` to `.env.local` and fill in `MONGODB_URI`, `MONGODB_DB` and `SESSION_SECRET` (32+ random chars; the generator command is in the file). Keep `DATA_SOURCE=mock` until the data is seeded.
3. **Indexes + ping**: `npm run db:indexes` (also runs automatically once per server process).
4. **Seed sample content**: `npm run db:seed`. Add `-- --reset` to wipe the content collections first. Each fixture user becomes `<username>@demo.example.com` with the password from `SEED_DEMO_PASSWORD`; if that is unset, a password is generated and printed once.
5. **Your admin account**: `npm run db:create-admin -- --email you@uni.edu.pk --username you --name "Your Name"`. It prompts for the password (hidden input) or reads `ADMIN_PASSWORD`. Running it on an existing email promotes that account.
6. **Switch reads to Mongo**: set `DATA_SOURCE=mongo` and restart the dev server.
7. Check the connection with `GET /api/health` → `{ ok: true, data: { db: "ok", … } }`.

Backend test server (does not collide with the frontend's `.next`): `NEXT_DIST_DIR=.next-backend npx next dev -p 3001`.

## 2. Layout

| Path | What |
|---|---|
| `src/server/env.ts` | Lazy env access; `ConfigError` when something is missing |
| `src/server/db/client.ts` | Cached `MongoClient` on `globalThis` (hot reload / serverless safe). Explains why the official driver was chosen over Mongoose |
| `src/server/db/collections.ts` | Stored document types (ObjectIds, Dates, private fields) + typed collection getters |
| `src/server/db/indexes.ts` | All indexes: unique, compound, text, TTL |
| `src/server/db/mappers.ts` | Doc → contract types (`id` strings, ISO dates, no private fields); derived debate status |
| `src/server/auth/` | argon2id passwords, server-side sessions, `getCurrentUser`, `requireUser`, `requireRole` |
| `src/server/http/` | `route()` wrapper (envelope, status codes, Origin check, error mapping), `readJson()` with zod, `ApiError` |
| `src/server/security/` | HTML sanitiser, Mongo-backed rate limiter |
| `src/server/validation/schemas.ts` | zod schema per endpoint, compile-time checked against `src/lib/api/contract.ts` |
| `src/server/services/` | Business rules: articles, debates, community (comments/discussions/reports/moderation), users |
| `src/server/storage/` | Pluggable upload storage (`StorageAdapter`), local adapter, magic-byte image sniffing |
| `src/server/data/mongo-source.ts` | The full read-side `DataSource` |

## 3. Collections & indexes

| Collection | Key indexes |
|---|---|
| `users` | unique `usernameLower`, unique `email`, `role+joinedAt`, `badges`, text(name, username, headline, university) |
| `sessions` | `_id` = sha256(token); TTL on `expiresAt`; `userId` |
| `categories` | `_id` = slug |
| `articles` | unique `slug`; `status+publishedAt`; `status+category+publishedAt`; `authorId+status+updatedAt`; `status+featured`; `status+stats.likes`; text(title, subtitle, excerpt, tags, body), language `none` (EN + UR) |
| `comments` | `targetType+targetId+createdAt`; `authorId` |
| `debates` | unique `slug`; `opensAt`; `closesAt`; text |
| `arguments` | `debateId+createdAt`; `authorId`; `parentId` |
| `discussions` | unique `slug`; `status+pinned+lastActivityAt`; `topic`; `authorId`; text |
| `initiatives`, `research` | unique `slug`; research text(title, abstract, keywords) |
| `ambassadors` | unique `userId` |
| `reports` | `status+createdAt`; `reporterId+target` |
| `likes` | unique `userId+targetType+targetId` |
| `votes` | unique `userId+argumentId` |
| `bookmarks` | unique `userId+articleId` |
| `follows` | unique `followerId+followeeId`; `followeeId+createdAt` |
| `newsletter` | unique `email` |
| `email_codes` | TTL on `expiresAt`; `userId+purpose` |
| `rate_limits` | TTL on `expiresAt` |

Counters (`stats.*`) are denormalised and updated with `$inc` on writes. Seeded fixtures keep the fixture numbers, so on demo data the counters are not real counts.

## 4. Endpoints

Every response is `{ ok: true, data }` or `{ ok: false, error: { code, message, fields? } }`, with `Cache-Control: no-store`.
HTTP status by code: `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `VALIDATION` 422 · `CONFLICT` 409 · `RATE_LIMITED` 429 (+ `Retry-After`) · `NOT_IMPLEMENTED` 501 · `SERVER_ERROR` 500.
If `MONGODB_URI` is missing, every endpoint returns 501 `NOT_IMPLEMENTED`, so the UI shows "Prototype — not saved".

| Endpoint | Who | Notes |
|---|---|---|
| `POST /api/auth/register` | anyone | Creates the account **unverified** and emails a 6-digit code. Writes then answer `403 EMAIL_UNVERIFIED` until it is confirmed (profile edits are allowed). Rate limit: 5/h per IP. Username `[a-zA-Z0-9_-]`, 3–30 chars, reserved names blocked. Password ≥ 10. Signs the user in |
| `POST /api/auth/login` | anyone | 20 / 15 min per IP, 8 / 15 min per account (reset on success). Same error for unknown email and wrong password; a dummy hash equalises timing. Suspended → 403 |
| `POST /api/auth/logout` | anyone | Deletes the server session and clears the cookie |
| `GET /api/auth/me` | anyone | `PrivateUser` or `null` |
| `POST /api/auth/verify-email` | signed in | `{ code }` (6 digits) → `PrivateUser` with `emailVerified: true`. 10 tries / 15 min; a code dies after 5 wrong tries |
| `POST /api/auth/resend-verification` | signed in | → `{ sentTo: "a****e@gmail.com", delivery }`. Max one per minute, 6 per hour |
| `POST /api/auth/forgot-password` | anyone | `{ email }` → `{ sent: true }`, whether or not the account exists |
| `POST /api/auth/reset-password` | anyone | `{ email, code, password }` → `PrivateUser`. Sets the password, marks the email verified, signs out all other sessions, signs this browser in |
| `GET /api/auth/providers` | anyone | `{ google, emailDelivery, uploads: "local" \| "cloudinary" \| "misconfigured" }`, so the UI only shows what is configured. Needs no DB |
| `GET /api/auth/google?next=/en/x&lang=en` | anyone | **Page navigation**, not `api()`. Redirects to Google. The callback signs the user in and goes to `next` (same-site paths only). Errors go to `/{lang}/login?error=` `google_unavailable`, `google_cancelled`, `google_failed`, `google_unverified_email` or `suspended` |
| `GET /api/auth/google/callback` | Google | Checks the state, exchanges the code with PKCE, verifies the ID token (signature, issuer, audience, expiry, nonce), then finds, links or creates the account |
| `PATCH /api/users/me` | user | Profile fields; `interests` must be known category slugs; `avatarUrl` https or `/api/uploads/…`; empty string clears a field |
| `POST /api/articles` | user | Always creates a **draft**. Body sanitised, excerpt/reading time derived, category must exist |
| `PATCH /api/articles/:id` | author | Archived articles are locked. If an untrusted author edits a published article, it goes back to `pending` |
| `POST /api/articles/:id/submit` | author | `draft`/`rejected` → `pending`. Trusted writers (role writer/moderator/admin or `featured-writer` badge) → `published`. Needs ≥ 200 chars of text |
| `DELETE /api/articles/:id` | author or admin | Hard delete plus its comments, likes and bookmarks |
| `POST /api/articles/:id/like` | user | Toggle → `{ likes, liked }`. Published articles only |
| `POST /api/articles/:id/bookmark` | user | **New** (added to the contract): toggle → `{ bookmarks, bookmarked }` |
| `POST /api/users/:id/follow` | user (verified) | Toggle → `{ followers, following }`. Following yourself → 422; missing or suspended user → 404. Keeps `stats.followers` (them) and `stats.following` (you) in step; a double-click race cannot double-count |
| `POST /api/newsletter` | anyone | `{ email, locale? }` → `{ subscribed: true }`. Idempotent (same email again is still ok); stored lower-cased with `createdAt`, plus `userId` when signed in. 10/h per IP |
| `POST /api/comments` | user | Target must be a published article or a visible, unlocked discussion; `parentId` must belong to the same target |
| `POST /api/debates` | moderator/admin | `closesAt > opensAt`; `weekNumber` = previous max + 1; context sanitised |
| `PATCH /api/debates/:id` | moderator/admin | Partial update |
| `POST /api/debates/:id/arguments` | user | **403 before `opensAt`, at/after `closesAt`, or once concluded.** Counterarguments/replies need a `parentId` in the same debate; arguments/solutions must not have one |
| `POST /api/debates/:id/conclusion` | moderator/admin | Only after `closesAt`. Body sanitised. Re-posting edits it |
| `POST /api/arguments/:id/vote` | user | `{ value: 1 \| -1 }`. Same value again removes the vote, the opposite value switches it. You cannot vote on your own argument |
| `POST /api/discussions` | user | Plain text |
| `POST /api/reports` | user | Target must exist; a preview snapshot is stored; duplicate open report → 409. 20/h |
| `PATCH /api/admin/users/:id` | moderator/admin | Role changes are admin-only. Moderators cannot touch staff accounts. You cannot suspend or demote yourself, or demote the last admin. **Suspension revokes all of that user's sessions** |
| `PATCH /api/admin/articles/:id` | moderator/admin | status / featured / editorsPick / moderationNote |
| `PATCH /api/admin/reports/:id` | moderator/admin | Sets `resolvedBy` when resolved or dismissed |
| `PATCH /api/admin/content/:type/:id` | moderator/admin | `type` = `comment` \| `argument` \| `discussion` |
| `POST /api/uploads` | user | multipart `file`; JPEG/PNG/WebP/GIF detected by **magic bytes** (SVG refused); ≤ 5 MB; 30/h → `{ url }` |
| `GET /api/uploads/…` | anyone | Serves local-adapter files (`nosniff`, sandbox CSP, immutable cache). Only keys in the exact generated format are served |
| `GET /api/health` | anyone | DB ping |

General write limit: 60 writes per minute per user. All write bodies have size caps.

## 5. Read side (`DATA_SOURCE=mongo`)

`src/server/data/mongo-source.ts` implements every `DataSource` method. Rules it enforces itself:
- `listArticles({ status })` with a non-published status returns items only to that author (`authorId` = the viewer) or to staff. Otherwise it returns an empty page. `getArticleBySlug` follows the same rule.
- Hidden/removed comments, arguments and discussions are never returned. Suspended users are hidden from public `listUsers`.
- **`listReports` and `getAdminStats` throw `AccessDeniedError` unless the viewer is a moderator or admin**, so admin pages must gate on `getCurrentUser()`.
- `isFollowing(userId)` is true when the signed-in viewer follows that user, and false when signed out.
- Debate `status` is computed from `opensAt`/`closesAt`/`conclusion` at read time, so no cron job is needed.
- Search uses Mongo `$text` for queries of 3+ characters and a case-insensitive regex for shorter ones. Page size is capped at 50.

## 6. Security notes

- **Passwords**: argon2id, 64 MiB / t=3 / p=1 (RFC 9106; above the OWASP minimum). `@node-rs/argon2` uses prebuilt binaries, and Next keeps it external by default.
- **Sessions**: a 256-bit random token in an `httpOnly; Secure; SameSite=Lax; Path=/` cookie (`forum_session`, 30-day absolute expiry). Only `sha256(token)` is stored. **Revocation** is a delete: logout removes one session, suspension or admin promotion removes all of a user's sessions, and a TTL index purges expired ones. There is no JWT, so nothing stays valid after revocation.
- **CSRF**: SameSite=Lax, plus every POST/PATCH/DELETE carrying an `Origin` header must match the host (or `ALLOWED_ORIGINS`).
- **Rich text** (`Article.body`, `Debate.context`, conclusion body, `Initiative.body`) goes through `sanitize-html` with exactly the tags listed in `domain.ts`: `h2 h3 p blockquote ul ol li strong em a img figure figcaption`. Links get `rel="noopener noreferrer nofollow ugc"` and `target=_blank`. Only http(s)/mailto links are kept. Images must be `https:` or our own `/api/uploads/`. Scripts, styles, iframes and event handlers are dropped.
- **Plain text** (titles, comments, arguments, bios…) is stored as typed, minus control and bidi-override characters. **It must be rendered as text (React escapes it), never with `dangerouslySetInnerHTML`.**
- **Validation**: zod on every body; unknown keys are rejected on PATCH bodies; ObjectId params are validated (invalid → 404).
- **Rate limits** are stored in Mongo (they work across serverless instances), with HMAC'd keys (no raw IPs or emails stored). `clientIp` trusts `X-Forwarded-For`, so deploy behind a proxy that overwrites it (Vercel, Cloudflare, Nginx). For heavy traffic, swap in Redis/Upstash.
- **Trade-off**: the per-account login limit means someone who knows your email can block your logins for up to 15 minutes. That is the price of stopping password guessing; consider CAPTCHA or email unlock later.
- **Errors**: unexpected errors are logged server-side and returned as a generic `SERVER_ERROR`; no stack traces reach clients. Duplicate-key errors become `CONFLICT` with the field name.
- **Email codes**: 6 digits from `crypto.randomInt`. Only an HMAC (keyed with `SESSION_SECRET`) is stored. They expire after 15 minutes (TTL index), die after 5 wrong tries, can be sent at most once a minute, are single-use, and are compared in constant time.
- **Google**: authorization code + PKCE (S256), `state` and `nonce` in an HMAC-signed, httpOnly, path-scoped, 10-minute cookie. The ID token is verified with Google's JWKS (`jose`). Only `email_verified` Google accounts are accepted. A Google login whose email matches an existing account links to it and marks it verified; otherwise a new member is created with no password (they can set one through forgot-password). `next` is restricted to same-site paths.
- **Not built yet (follow-ups)**: change-password while signed in, account lockout notifications, audit log for admin actions, and view counters (`stats.views` is never incremented; reads stay side-effect free).

## 7. Uploads: local and Cloudinary

| Driver | When it's used | URLs | Good for |
|---|---|---|---|
| `local` | default | `/api/uploads/YYYY/MM/<hex>.ext`, served by `GET /api/uploads/…` from `UPLOAD_DIR` | development, one long-running server |
| `cloudinary` | `UPLOAD_DRIVER=cloudinary`, **or automatically when `CLOUDINARY_URL` is set** and `UPLOAD_DRIVER` is unset or `local` | `https://res.cloudinary.com/<cloud>/image/upload/…` | **Vercel / production** |

**Setup (one line):** Cloudinary → Settings → API Keys → copy the "API environment variable" into `.env.local` (and Vercel's env settings) as `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`. Optionally set `CLOUDINARY_FOLDER` (default `the-forum`). `GET /api/auth/providers` then reports `uploads: "cloudinary"`.

How it works: the image is checked first (magic-byte sniffing, JPEG/PNG/WebP/GIF only, ≤ 5 MB). It is then sent to `https://api.cloudinary.com/v1_1/<cloud>/image/upload` as a **signed** upload over `fetch`, with no SDK: `api_key`, `folder`, a random `public_id`, `timestamp`, and `signature` = SHA-1 of the sorted `k=v&…` params plus the API secret. The secret is never sent or exposed. The API returns `{ url: secure_url }`.

A malformed `CLOUDINARY_URL`, or `UPLOAD_DRIVER=cloudinary` without one, makes uploads answer `501 NOT_IMPLEMENTED` naming the problem (no crash). `providers` then shows `uploads: "misconfigured"`. Files uploaded locally earlier stay reachable at `/api/uploads/…` after switching. The frontend adds `res.cloudinary.com` to `images.remotePatterns`; sanitised article HTML already allows any `https:` image.

## 8. Scripts

| Script | What |
|---|---|
| `npm run db:indexes` | Ping + create all indexes |
| `npm run db:seed [-- --reset]` | Load `src/lib/data/mock/fixtures/*.ts` into Mongo (idempotent upserts; stable ObjectIds derived from fixture ids). Refuses to run with `NODE_ENV=production` unless given `--allow-production` |
| `npm run db:create-admin -- --email … [--username …] [--name …]` | Create an admin, or promote an existing account |
| `npm run db:create-admin -- --email … --set-password` | Change an existing account's password (hidden prompt, typed twice). Signs that account out everywhere |

The scripts run with `tsx --conditions=react-server --env-file-if-exists=.env.local`. The `react-server` condition lets them import the same `server-only` modules the app uses.

## 9. Troubleshooting

- **`google_failed` after choosing an account**: the server log shows why. `redirect_uri_mismatch` means the redirect URI in Google Cloud must exactly equal `APP_URL` + `/api/auth/google/callback`. `invalid_client` means the ID or secret is wrong.
- **Gmail `535 Username and Password not accepted`**: use an App Password (not your normal password); 2-Step Verification must be on.

- **`querySrv ECONNREFUSED` with a `mongodb+srv://` URI (seen on Windows)**: Node's DNS resolver sends the SRV lookup to the router (e.g. 192.168.1.1), which refuses it, even though Windows itself resolves the name. Use Atlas's **standard (non-SRV) connection string** instead: Connect → Drivers, pick an older driver version to get `mongodb://host1:27017,host2:27017,host3:27017/?tls=true&replicaSet=…&authSource=admin`. You can also point the machine at a public DNS server such as 1.1.1.1.
- **`language override unsupported: ur` while seeding**: a text index reads a document field named `language` as that document's search language, and Urdu is not one MongoDB supports. Every text index therefore sets `language_override: "textLanguage"` (a field we never write) and `default_language: "none"`. `ensureIndexes` drops and recreates any older text index whose options differ, so `npm run db:indexes` fixes an existing database by itself.
- **`tlsv1 alert internal error` / `SSL alert number 80` / `MongoServerSelectionError`**: Atlas is rejecting this machine's IP. Add your current public IP under Atlas → Security → **Network Access** (home connections often get a new IP). API routes then answer "The database is unreachable right now".
- **`IndexOptionsConflict` after changing an index**: drop the old index in Atlas (or add it to the drop-and-recreate logic in `indexes.ts`), then run `npm run db:indexes`.
- **Stopping the backend dev server**: on Windows, killing the `npx next dev` wrapper can leave the Next server running on 3001 (`EADDRINUSE` next time). Find it with `Get-NetTCPConnection -LocalPort 3001` and stop that PID.

## 11. Email (Gmail) and Google sign-in — what you set up

Secrets go **only** in `.env.local` (gitignored), never in chat or the repo.

**Gmail App Password (verification and reset emails)**
1. Turn on 2-Step Verification for the Gmail account the site will send from: myaccount.google.com → Security.
2. Open myaccount.google.com/apppasswords, create one named "THE FORUM", and copy the 16 characters.
3. In `.env.local` set `SMTP_USER=that@gmail.com`, `SMTP_PASS=the16chars` (spaces are fine) and optionally `MAIL_FROM="THE FORUM <that@gmail.com>"`. Restart the dev server.
4. `GET /api/auth/providers` should now show `emailDelivery: true`. Gmail allows about 500 emails a day; for production use a transactional provider (Resend, SES, Postmark) with the same SMTP variables.

Until this is set, development prints each code to the server console and responses say `delivery: "dev-console"`. In production, sending fails loudly instead.

**Google OAuth client (Continue with Google)**
1. console.cloud.google.com → create or select a project → APIs & Services → **OAuth consent screen**: External, app name "THE FORUM", your support email, scopes `openid email profile`. While the app is in "Testing", add yourself as a test user.
2. **Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorised JavaScript origins: `http://localhost:3000` (later your production domain).
   - Authorised redirect URIs: `http://localhost:3000/api/auth/google/callback` (later `https://<domain>/api/auth/google/callback`).
3. In `.env.local` set `GOOGLE_CLIENT_ID=…`, `GOOGLE_CLIENT_SECRET=…` and `APP_URL=http://localhost:3000`. Restart.
4. `/api/auth/providers` shows `google: true`; open `/api/auth/google?lang=en` to try it.

## 12. Verification

| What | How it was verified |
|---|---|
| All 25 route handlers | Compiled by Turbopack on `next dev -p 3001`; each returns the envelope (501 without DB, 403 for a cross-site Origin, 405 for wrong methods). `tsc` passes with Next's generated route-type validator |
| Sanitiser, plain-text cleaning, image sniffing, slugs, zod schemas, debate-status logic, argon2id hash/verify | Unit-checked with a tsx script |
| Atlas connection, `db:indexes`, `db:seed -- --reset` | **Verified on Atlas (2026-11-15).** All 11 collections match the fixture counts. The 5 text indexes have `language_override=textLanguage`. `$text` search works for English and Urdu. `GET /api/health` → 200 and `GET /api/auth/me` → `null` (no cookie) from the 3001 server |
| **All write endpoints against Atlas** | **Verified 2026-11-22: 103/103 end-to-end checks** through the 3001 server, with database assertions and full cleanup. Covered: register/login/logout/me, session revocation after logout and after suspension, argon2id and token-hash storage, cookie flags, Origin/CSRF block, profile PATCH, the whole article lifecycle (draft → pending → moderated → published, a published edit going back to review, like/bookmark toggles incl. a concurrent double-like, delete with cascade), comments and replies, discussions, debates (role checks, open/closed/upcoming windows, counterargument parent rules, votes incl. switching and own-vote block, conclusion rules), reports (duplicate and self-report blocked), admin content/articles/reports/users (moderator vs admin limits, self-demotion blocked), uploads (magic-byte check, SVG blocked, > 5 MB blocked, serving headers, traversal), per-account login rate limit → 429 |
| **`mongo-source` / pages with `DATA_SOURCE=mongo`** | **Verified 2026-11-22:** public pages in EN and UR return 200; a missing slug returns 404; protected pages redirect when signed out; as the seeded admin, dashboard/write/settings and all 5 admin pages return 200 (exercises `getAdminStats`, `listReports`, `getCurrentUser`) |
| **Email verification, reset, Google (2026-11-22)** | **38/38 end-to-end checks** against Atlas with SMTP unset (codes read from the dev-console mailer) and *fake* Google credentials. Covered: register → EMAIL_UNVERIFIED on writes → code → writes allowed; codes stored only as HMAC; resend cooldown; 5-wrong-tries lockout; forgot/reset (no enumeration, single-use code, old sessions revoked, old password dead); Google start URL (PKCE S256, state, nonce, scopes, redirect URI), state cookie flags, cancel / forged state / missing cookie / rejected code exchange, open-redirect block; account create/link/unverified-email refusal at service level. **Real Gmail delivery verified 2026-11-22:** SMTP login OK and a password-reset code sent through the app to the admin inbox. **Not yet verified:** a real Google login (needs the OAuth client). The 103-check write suite was re-run with the new guard: 103/103 |
| **Follow + newsletter + `isFollowing` (2026-11-22)** | **23/23 end-to-end checks** on Atlas: 401 when signed out, EMAIL_UNVERIFIED, self-follow 422, bad/missing/suspended user 404, follow/unfollow counters on both users, concurrent double-click, `isFollowing` true/false, profile page 200; newsletter signed out and signed in (userId + locale), idempotent, lower-cased, invalid email 422, cross-site 403, IP rate limit 429. All test rows deleted |
| **Cloudinary adapter (2026-11-22)** | **23/23 unit checks** (no real key yet): the signature matches Cloudinary's documented example; URL parsing (incl. a pasted prefix or quotes); auto/explicit driver selection; ConfigError for a missing, bad or unknown driver; the exact upload request (endpoint, fields, signature, bytes, secret never sent) against a mocked API; error passthrough; folder override; local fallback writing and reading a real file. **7/7 upload-route checks on Atlas with the local driver** (401, upload, serve, SVG 422, > 5 MB 422, Cloudinary avatar URL accepted). **Real Cloudinary verified 2026-11-22** (cloud `nbfno6ja`): signed upload → `https://res.cloudinary.com/nbfno6ja/…`, fetched back 200 image/png, test image deleted |
