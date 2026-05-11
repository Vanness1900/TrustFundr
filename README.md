# TrustFundr
A website where people can gather funds for all sorts of things through the help of donators.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## End-to-end tests (Playwright)

Login flows are covered with [Playwright](https://playwright.dev/). Specs live under [`tests/`](tests/); API stubs for login are in [`tests/mocks/`](tests/mocks/). Generated artifacts go to `tests/test-results/` and `tests/playwright-report/` (both gitignored). Tests start the app with `next build` and `next start`, and **stub** requests to `**/api/auth/login` so you do not need the real backend on port 8080.

One-time browser install (after `npm install`):

```bash
npm run playwright:install
```

This project’s scripts clear `PLAYWRIGHT_BROWSERS_PATH` for the install and test commands so Playwright uses the default cache under your user profile (some tools set `PLAYWRIGHT_BROWSERS_PATH` to a shared cache with the wrong OS architecture, which breaks browser launch). On Windows, run `set PLAYWRIGHT_BROWSERS_PATH=` in the same terminal, then `npx playwright install chromium`.

Run tests (the dev server is started automatically):

```bash
npm run test:e2e
```

Debug in UI mode:

```bash
npm run test:e2e:ui
```

After a run, open the HTML report with `npx playwright show-report tests/playwright-report` if needed (or open `tests/playwright-report/index.html` in a browser).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
