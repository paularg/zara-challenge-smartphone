# MBST Smartphone Store

MBST is a React application for browsing smartphone Products, opening Product details, and managing a Cart. The current catalog slice loads and normalizes the first 20 unique Products from the challenge API and presents explicit loading, empty, error, image-failure, and retry outcomes.

## Requirements

- Node.js 20.19 or newer
- pnpm 11

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

The browser reads `API_KEY` from `.env` and sends it as the `x-api-key` header described in `docs/adr/0001-call-challenge-api-from-the-browser.md`. Missing configuration is reported in the catalog instead of using a hardcoded fallback.

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

The catalog service treats the external payload as unknown, supports the live array response despite the OpenAPI object mismatch, removes duplicate Product identities in first-seen order, repairs HTTP image URLs to HTTPS, and limits the rendered result to 20 Products. Automated browser checks use deterministic API and image responses at 393, 768, 834, 1280, and 1920 px.

The interface follows `DESIGN.md`: Helvetica Neue with an Arial fallback, a monochrome palette, square geometry, hairline borders, an 80px header, and responsive page edges of 16px, 40px, and 100px.
