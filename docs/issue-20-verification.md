# Issue #20 verification

Verified on 2026-08-29 against the challenge API and the completed local implementation.

## Delivery gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `pnpm format:check` | PASS | Every matched file uses the configured Prettier style. |
| `pnpm lint` | PASS | ESLint completed without findings. |
| `pnpm typecheck` | PASS | The TypeScript project build completed without diagnostics. |
| `pnpm build` | PASS | Vite 8.2.2 transformed 153 modules and produced the production bundle. |
| `pnpm test` | PASS | 9 Vitest files and 100 tests passed. |
| `pnpm test:e2e` | PASS | 117 Playwright tests passed in 27.4 seconds. |

The Playwright process printed a tooling-only warning that `NO_COLOR` was ignored because `FORCE_COLOR` was set. It did not come from application code or the browser console and did not affect the result.

## Automated coverage

Transport-boundary tests now cover a partial `specs` object, invalid Product identity, variant-selection, image, and price fields, and an empty `storageOptions` array. Product-detail integration tests cover the visible partial-specification and unavailable-configuration results.

The Playwright journey runs at the configured 393 px, 768 px, 834 px, 1280 px, and 1920 px Chromium viewports and at 393 px in branded Chrome, Firefox, and WebKit. It verifies that an omitted specification does not produce a row, that an empty storage list produces an accessible explanation and Browse Products action, that no incomplete Product variant can be added, and that Axe reports no WCAG 2.2 A/AA violations in the new state. Browser-problem monitoring found no unexpected console messages, page errors, error responses, or failed requests.

## Live `APL-IP13-128` journey

The ignored `.env` configuration was used without reading, printing, or copying `API_KEY` into repository files. The live challenge API returned:

- Product `APL-IP13-128`, Apple iPhone 13, base price 619 EUR;
- seven supported specification keys plus an additional upstream `storage` key, with `screenRefreshRate` omitted;
- six colors, three storage configurations, and six similar Products.

At 393 × 852, the local application rendered the Product rather than the invalid-payload state. The specification table included all available supported values and omitted the Screen refresh rate row. Selecting `128 GB` and `Medianoche` produced a complete Product variant at 619 EUR, enabled Add to cart, and navigated to a Cart containing one line with quantity 1 and a 619 EUR total.

## Design verification

The Figma Product-detail frames were inspected at desktop (`20620:7142`), tablet (`20655:2361`), and mobile (`20669:2202`). The unavailable-configuration state has no dedicated source frame, so it remains within the existing Product information column and reuses the repository Button primitive, Figma spacing, monochrome treatment, square geometry, and responsive widths. `DESIGN.md` remains the design-system source of truth.

## Remaining constraints

- The challenge API and external Product images remain live availability dependencies.
- The direct-browser `API_KEY` exposure remains the exercise-only trade-off accepted by ADR-0001.
- Checkout remains intentionally outside scope.
