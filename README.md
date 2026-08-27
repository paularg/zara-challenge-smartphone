# MBST Smartphone Store

MBST is a React application for browsing smartphone Products, opening Product details, and managing a Cart. This first application-shell slice establishes the routes, design tokens, shared header, client state, tests, and continuous-integration gates used by later customer journeys.

## Requirements

- Node.js 20.19 or newer
- pnpm 11

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

The challenge API is not called by this shell yet. Later API-backed slices will read `API_KEY` from `.env` and send it as the `x-api-key` header described in `docs/adr/0001-call-challenge-api-from-the-browser.md`.

## Quality commands

Each gate runs independently:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm test:e2e
```

Install the Chromium binary before the first local end-to-end run if Playwright has not already done so:

```bash
pnpm exec playwright install chromium
```

## Application structure

- `src/app` owns application-level composition when it is needed.
- `src/features` keeps feature UI and state together behind public `index.ts` exports.
- `src/components/shared` contains proven shared UI such as the header.
- `src/components/ui` contains product-agnostic shadcn/ui primitives adapted to the MBST design system.
- `src/lib` contains shared framework utilities.
- `e2e` contains critical browser journeys.

The confirmed catalog route is `/`, Product details use `/products/:productId`, and the Cart is available at `/cart`. The header exposes the home and Cart links on every route. Zustand owns the shared Cart unit count, which starts at zero in this shell.

The interface follows `DESIGN.md`: Helvetica Neue with an Arial fallback, a monochrome palette, square geometry, hairline borders, an 80px header, and responsive page edges of 16px, 40px, and 100px.
