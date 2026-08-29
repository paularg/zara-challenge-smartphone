# MBST Smartphone Store

MBST is a responsive React storefront for browsing and searching smartphone Products, choosing an exact Product variant, and keeping that selection in a persisted Cart. The application is a reviewable technical-exercise delivery: checkout and production deployment are intentionally not implemented.

## Prerequisites

- Node.js 20.19 or newer
- pnpm 11 (the exact package-manager version is recorded in `package.json`)
- A challenge API key

Install the locked dependencies and create the local environment file:

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

Replace the placeholder in `.env` with the supplied key:

```dotenv
API_KEY=your_api_key_here
```

`.env` is ignored by Git and must not be committed. The key is required for live development but is deliberately replaced by a non-secret placeholder in deterministic tests and CI.

## Development and quality commands

Run the development server:

```bash
pnpm dev
```

The repository exposes each delivery gate independently:

| Purpose                               | Command             |
| ------------------------------------- | ------------------- |
| Format files                          | `pnpm format`       |
| Check formatting without writing      | `pnpm format:check` |
| Lint                                  | `pnpm lint`         |
| Type-check                            | `pnpm typecheck`    |
| Create the production build           | `pnpm build`        |
| Run Vitest unit and integration tests | `pnpm test`         |
| Run Vitest while developing           | `pnpm test:watch`   |
| Run Playwright end-to-end tests       | `pnpm test:e2e`     |
| Preview a completed production build  | `pnpm preview`      |

Install the browser binaries before the first local end-to-end run if they are not already available:

```bash
pnpm exec playwright install chromium chrome msedge firefox webkit
```

## Feature boundaries and public data flow

The repository follows feature-first boundaries:

- `src/features/catalog` owns Catalog UI, URL-backed Search state, request lifecycle, and Catalog payload normalization.
- `src/features/productDetails` owns Product detail UI, remote detail data, Product variant selection, and variant construction.
- `src/features/cart` owns Cart rules, the Zustand store, derived count and total, versioned persistence, and Cart UI.
- `src/components/shared` contains proven cross-feature UI such as the Header and Product card.
- `src/components/ui` contains product-agnostic UI primitives.
- `src/lib` contains shared framework infrastructure rather than Product rules.
- `e2e` contains application journeys that cross feature boundaries.

Features expose cross-boundary use through their `index.ts` files. Runtime data follows one direction:

```text
UI -> feature hook or store action -> feature service -> challenge API
```

Catalog and Product detail services treat remote payloads as `unknown`, validate and normalize them, and return application-level success or failure results. Components do not depend on response transport details. Adding a configured Product takes the other public path:

```text
ProductDetailsPage -> create Product variant -> Cart store action -> localStorage
```

## State ownership and commerce semantics

Each fact has one owner:

| State                                        | Owner                                         |
| -------------------------------------------- | --------------------------------------------- |
| Confirmed Search query                       | The `search` URL parameter                    |
| Debounced Search draft and request lifecycle | Catalog hook/component state                  |
| Remote Catalog and Product detail data       | Feature hooks backed by feature services      |
| Selected color and storage                   | Product detail component state                |
| Cart lines                                   | Zustand Cart store                            |
| Persisted Cart snapshot                      | Versioned `mbst-cart` entry in `localStorage` |
| Cart unit count and total                    | Selectors derived from Cart lines             |

A **Product variant** is one Product plus one selected color and one selected storage capacity. Storage supplies the final unit price; color supplies the image saved with the purchase intent. A variant exists only after both selections have been made.

A **Cart line** is a Product variant plus its quantity. Product id, color, and storage form its identity. Adding the same identity increments one line; changing either option creates a different line. Removing decrements one unit and deletes the line at zero. The total is the sum of each saved unit price multiplied by its quantity.

Cart persistence stores a versioned presentation snapshot with no expiry, so a refresh or new browser page does not refetch or reprice existing lines. Invalid, corrupt, duplicate, or incompatible persisted data recovers to an empty Cart instead of breaking the application.

## API integration and deterministic isolation

The application calls `https://prueba-tecnica-api-tienda-moviles.onrender.com` directly from the browser and sends `API_KEY` in the `x-api-key` header. Vite therefore embeds the configured value in client code where browser users can inspect it. This is an accepted technical-exercise trade-off, not a secure pattern for production credentials; see [ADR-0001: Call the challenge API from the browser](docs/adr/0001-call-challenge-api-from-the-browser.md).

The live API has several observed contract and data defects that the feature services isolate:

- the Product-list endpoint returns an array although the OpenAPI list schema describes an object;
- the live list can contain duplicate Product ids, so results are deduplicated in first-seen order;
- combining `limit` and `offset` produces unreliable results, so the initial Catalog takes the first 20 normalized Products and Search avoids pagination parameters;
- some image URLs use HTTP and are upgraded to HTTPS;
- storage-option `price` is treated as the final unit price, not a supplement;
- missing configuration, authentication, not-found, network, server, invalid JSON, and invalid payload failures are normalized before reaching the UI;
- obsolete Search and Product detail requests are cancelled so stale data cannot replace newer navigation state.

Vitest replaces the external `fetch` boundary with explicit fixtures. Playwright intercepts API and image requests with deterministic responses, so the automated suite does not depend on the challenge service, credentials, changing Product data, or external image hosts. The separate live-API browser journey and its remaining external risks are recorded in [the final issue #10 verification](docs/issue-10-verification.md).

## Accessibility and responsive verification

The target is WCAG 2.2 AA. The implementation uses semantic landmarks and controls, accessible names and state, keyboard-operable Search and Product options, visible focus, a skip link, polite announcements, useful image alternatives, sufficient contrast, and reduced-motion handling. Automated Playwright journeys include axe-core checks, keyboard interaction, browser-console monitoring, and unexpected failed-request monitoring.

The canonical Figma-derived viewports are 393 × 852, 834 × 1194, and 1920 × 1080. Playwright also checks 768 × 1024 and 1280 × 800 to protect transitions between the mobile, tablet, and desktop compositions. Critical journeys run in bundled Chromium and Firefox, current Google Chrome and Microsoft Edge through their branded channels, and Safari-compatible WebKit with Playwright's complete iPhone 15 Mobile Safari profile. The iPhone profile supplies its mobile user agent, touch support, device scale, screen, and browser viewport instead of simulating Safari with a desktop context resized to 393 px. `DESIGN.md` owns the design system; the linked Figma frames own screen composition.

## Continuous integration

`.github/workflows/quality.yml` installs dependencies from `pnpm-lock.yaml` with `--frozen-lockfile` and runs Prettier, ESLint, TypeScript plus the production build, Vitest, and Playwright as independent jobs. The end-to-end job deterministically installs bundled Chromium, Firefox, and WebKit plus the branded Chrome and Edge channels before running the complete configured matrix. CI supplies a non-secret placeholder `API_KEY` because every automated external request is deterministic. The workflow uploads the Playwright report for diagnosis and performs no deployment.

## Outside scope

This delivery intentionally excludes:

- deployment or hosting;
- server-side rendering (SSR);
- a proxy, backend, or backend-for-frontend;
- enabled checkout or payment behavior;
- additional Product filters;
- Catalog or Search pagination.
