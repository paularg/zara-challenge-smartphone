# Issue #10 final verification

Verified on 2026-08-28 against the final uncommitted working tree.

## Delivery gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `pnpm format:check` | PASS | Every matched file used the configured Prettier style. |
| `pnpm lint` | PASS | ESLint completed without findings. |
| `pnpm typecheck` | PASS | The TypeScript project build completed without diagnostics. |
| `pnpm build` | PASS | Vite 8.2.2 transformed 153 modules and produced the production bundle. |
| `pnpm test` | PASS | 9 Vitest files and 93 tests passed. |
| `pnpm test:e2e` | PASS | 109 Playwright tests passed in 24.1 seconds. |

The Playwright process printed a tooling-only warning that `NO_COLOR` was ignored because `FORCE_COLOR` was set. It did not come from application code or the browser console and did not affect the result.

## Automated browser coverage

The deterministic Playwright suite exercised these configured projects:

- Chromium at 393 × 852, 768 × 1024, 834 × 1194, 1280 × 800, and 1920 × 1080;
- branded Google Chrome at 393 × 852 for every `@critical` journey;
- Firefox at 393 × 852 for every `@critical` journey;
- Safari-compatible WebKit at 393 × 852 for every `@critical` journey.

The 109 passing tests cover Catalog, Search, Product detail, Product variant selection, similar Products, Cart persistence and pricing, navigation and history, loading and recovery states, failed imagery, canonical geometry, intermediate-width overflow, and malformed persisted data. API and image boundaries are intercepted with deterministic fixtures and a non-secret placeholder key.

Browser-problem monitoring found no unexpected console errors or warnings, page errors, HTTP error responses, or failed requests. Axe scans using the `wcag2a`, `wcag2aa`, and `wcag22aa` tags reported no violations in the exercised states. Keyboard journeys, accessible names and states, visible focus, the skip link, live announcements, reduced motion, and the disabled checkout explanation also passed.

## Separate live-API journey

The local application was exercised separately in the Codex in-app browser at 393 × 852 using the real `API_KEY` from the ignored `.env` file. The key was not read, printed, or copied into repository files.

The live journey produced this evidence:

1. Catalog loaded 20 normalized Products.
2. Searching for `iPhone` updated the URL to `/?search=iPhone` and returned 2 Products.
3. Opening `APL-IP13-128` reached the recoverable invalid-payload state. The live detail response did not satisfy the application contract, so the page displayed `The Product detail response is invalid.` with Retry and Back-to-catalog actions.
4. Opening the Catalog Product `SMG-S24U` loaded a complete Galaxy S24 Ultra detail, its specifications, three storage options, four colors, and similar Products.
5. Selecting `256 GB` and `Titanium Black` completed the Product variant, changed the image alternative, enabled `ADD TO CART`, and displayed the storage option's final price of 1229 EUR.
6. Adding navigated to `/cart` with one line, quantity 1, the selected variant data, a 1229 EUR total, and the disabled checkout explanation.
7. Reloading `/cart` preserved that line, quantity, snapshot price, and total without a Product-detail refetch.
8. Removing one unit produced Cart (0), removed the payment control, exposed Continue shopping, and announced that the Cart was empty.

The live tab recorded zero console warnings or errors. Catalog, Search, the Galaxy S24 Ultra detail, and external Product imagery all produced usable application results without a visible network-failure state. The iPhone 13 detail failure was a payload-normalization failure rather than an unhandled exception; it is recorded below as an external data risk.

## Figma and responsive source status

The repository Figma copy was available during the completed responsive verification. The inspected source was the `Design` page (`20602:154392`) and its desktop (`20620:9054`), tablet (`20669:2483`), and mobile (`20669:2484`) sections. Catalog, Product detail, similar Products, filled Cart, and empty Cart frames were checked at the canonical 1920 px, 834 px, and 393 px compositions. There is no remaining Figma-access constraint.

`DESIGN.md` remains the design-system source of truth and Figma remains the screen-composition source of truth. The automated canonical and intermediate viewport results above protect the accepted compositions.

## CI parity

`.github/workflows/quality.yml` defines independent format, lint, type-and-build, unit-and-integration, and end-to-end jobs. Every job installs from `pnpm-lock.yaml` with `pnpm install --frozen-lockfile`; the workflow supplies the non-secret `test-api-key` placeholder and has no deployment job or deployment step. The local commands recorded above are the same commands invoked by GitHub Actions.

Because the delivery must remain uncommitted, GitHub Actions cannot execute against this exact working tree. Remote CI status is therefore an external review step, not evidence claimed by this local verification.

## Remaining constraints and risks

- The direct-browser architecture deliberately makes `API_KEY` visible in the client bundle and request headers. ADR-0001 accepts this only for the technical exercise; production credentials require a server-side boundary.
- The challenge API and external image hosts remain availability and data-quality dependencies during live use. Automated tests are isolated from both.
- The live `APL-IP13-128` detail payload was incompatible with the documented application contract on 2026-08-28. The UI contained the failure, but that Product could not complete the Cart journey until the upstream payload is corrected or a new normalization rule is agreed.
- API contents can change independently of this repository, including Product ordering, duplicates, prices, option sets, image URLs, and payload shape.
- GitHub Actions has not run against the uncommitted documentation diff; local parity is complete, but the remote runner result remains external.
- Deployment, SSR, a backend-for-frontend, enabled checkout, additional filters, and pagination are intentionally outside scope.

No deployment was performed, and no API key or other secret was added to the working tree.
