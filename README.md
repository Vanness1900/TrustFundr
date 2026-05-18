# TrustFundr

Web frontend for TrustFundr — an online fundraising platform connecting fundraisers, donees, admins, and platform managers. Built with **Next.js 16**, **React 19**, and **Tailwind CSS**.

The API lives in [`../trustfundr-be`](../trustfundr-be/).

## Requirements

- **Node.js** 20+ (LTS recommended)
- **npm** (or yarn / pnpm / bun)
- For full-stack development: running [`trustfundr-be`](../trustfundr-be/) on port **8080** with PostgreSQL configured

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The landing page is [`src/app/page.tsx`](src/app/page.tsx). Role dashboards live under `src/app/` (see [App routes](#app-routes) below).

## Full stack local development

1. Configure and start the backend (see [trustfundr-be README](../trustfundr-be/README.md)):
   ```bash
   cd ../trustfundr-be
   cp .env.example .env
   # edit .env, then:
   ./mvnw spring-boot:run
   ```
2. Start the frontend (this repo):
   ```bash
   npm install
   npm run dev
   ```
3. Log in at `/login` using seeded accounts (e.g. `admin` / `admin123` — see backend README).

### Environment variables

Optional `.env.local` in this directory:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend origin for direct API calls (default `http://localhost:8080`). Also used by Next.js rewrites for `/api/*` → backend. |

If unset, the app defaults to `http://localhost:8080`. Some pages can use same-origin `/api/...` via rewrites to avoid CORS during local dev.

## App routes

| Path | Role |
|------|------|
| `/` | Home |
| `/login` | Login (all roles) |
| `/admin` | User admin — profiles & accounts |
| `/fundraiser` | Fundraiser dashboard |
| `/fundraiser/create` | Create campaign |
| `/fundraiser/campaigns/[id]` | Campaign detail |
| `/fundraiser/campaigns/[id]/manage` | Manage campaign |
| `/donee` | Donee — browse campaigns |
| `/donee/campaigns/[id]` | Campaign detail |
| `/donee/favourites` | Favourite list |
| `/donee/donations` | Donation history |
| `/platform-manager` | Platform manager dashboard |
| `/platform-manager/categories` | Fundraising categories |
| `/platform-manager/analytics` | Reports |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run playwright:install` | Install Chromium for Playwright (once, after `npm install`) |
| `npm run test:e2e` | Run Playwright tests (builds app, stubs login API) |
| `npm run test:e2e:ui` | Playwright UI mode |

## End-to-end tests (Playwright)

Login flows are covered with [Playwright](https://playwright.dev/). Specs live under [`tests/`](tests/); API stubs are in [`tests/mocks/`](tests/mocks/). Artifacts go to `tests/test-results/` and `tests/playwright-report/` (gitignored).

Tests run `next build` and `next start`, and **stub** `**/api/auth/login` — you do **not** need the backend on port 8080 for e2e.

One-time browser install:

```bash
npm run playwright:install
```

Scripts clear `PLAYWRIGHT_BROWSERS_PATH` so Playwright uses your user cache (avoids wrong-architecture shared caches). On Windows, run `set PLAYWRIGHT_BROWSERS_PATH=` in the same terminal, then `npx playwright install chromium`.

```bash
npm run test:e2e
npm run test:e2e:ui   # debug UI
```

Report: `npx playwright show-report tests/playwright-report` or open `tests/playwright-report/index.html`.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
