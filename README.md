# THE FORUM

**Think. Write. Debate. Act.** An intellectual publishing and debate community, starting with university students in Pakistan and built to grow internationally. English (left-to-right) and Urdu (right-to-left) throughout.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MongoDB Atlas

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. It redirects to `/en` or `/ur` based on your browser language (or your last choice).

Out of the box the site runs on **sample content** (`DATA_SOURCE=mock`). A banner at the top says so, and every form that would save something tells you honestly that it was *not saved*. To connect the real database, follow [`docs/BACKEND.md`](docs/BACKEND.md): put your Atlas connection string in `.env.local`, run `npm run db:indexes`, `npm run db:seed` and `npm run db:create-admin`, then set `DATA_SOURCE=mongo`.

## Pages

| Page | Route |
|---|---|
| Homepage | `/[lang]` |
| Explore articles (filters, search, sort) | `/[lang]/articles` |
| Article details (comments, like, bookmark, share, report) | `/[lang]/articles/[slug]` |
| Write (rich text, drafts, preview, cover image) | `/[lang]/write` |
| Weekly debates | `/[lang]/debates` |
| Individual debate (arguments, counterarguments, replies, solutions, deadline, conclusion) | `/[lang]/debates/[slug]` |
| Open discussions (+ start a discussion) | `/[lang]/discussions`, `/[lang]/discussions/[slug]` |
| Community & initiatives (challenges, ambassadors, writers, recognition) | `/[lang]/community` |
| Research hub | `/[lang]/research` |
| User profile (publication history) / edit profile | `/[lang]/u/[username]`, `/[lang]/settings/profile` |
| Sign in / Register | `/[lang]/login`, `/[lang]/register` |
| Admin: overview & analytics, users, articles, debates, reports | `/[lang]/admin/*` |

## How it's organised

```
src/
  app/[lang]/…          pages (server components), one root layout per locale (sets lang + dir)
  app/api/…             write API route handlers (backend)
  components/…          UI: layout, cards, editor, debate, comments, moderation, admin
  i18n/                 config, English + Urdu dictionaries, date/number formatting
  lib/data/             READ side: getData() → DataSource (mock today, Mongo with DATA_SOURCE=mongo)
  lib/api/              WRITE side: typed endpoint contract + client
  server/               backend: Mongo client, auth, services, validation, sanitising, storage
  types/domain.ts       the shared domain model
  proxy.ts              locale redirect (Next 16's replacement for middleware)
```

Pages never talk to the database directly. They call `getData()`, which returns the same `DataSource` interface whether it is backed by sample fixtures or MongoDB. Client components write through `api("POST /api/…")`, which is typed against `src/lib/api/contract.ts`. So turning on the backend changes no UI code.

## Design

Warm ivory paper, near-black ink and a terracotta accent, with a matching dark mode (toggle in the header). Headings use Newsreader (serif) and the interface uses Inter. Urdu uses Noto Nastaliq Urdu for display text and Noto Naskh Arabic for reading. Article covers without an uploaded image get generated, deterministic editorial artwork (Mughal arches, river lines, sun-over-horizon and more), so the site never depends on stock photos.

## Accessibility & SEO

- Semantic landmarks, a skip link, labelled forms, `aria-current` navigation, live regions for form results, visible focus rings and reduced-motion support.
- `hreflang` alternates and canonicals on every page, Open Graph metadata, JSON-LD (`Article`, `ScholarlyArticle`, `Person`), `sitemap.xml` and `robots.txt`. Admin, write and settings pages are `noindex`.

## Not done yet (honest list)

- Following users, newsletter sign-up, ambassador applications and initiative sign-ups have no API endpoint yet. Their buttons say "Prototype — not saved".
- Cover images chosen in the editor are previewed locally but not uploaded (`/api/uploads` exists; wiring is pending).
- Research PDFs and citation export are placeholders.
- No automated tests yet.
