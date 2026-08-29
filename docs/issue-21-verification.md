# Issue #21 verification

Verified on 2026-08-29 against the Design page in Figma and the completed local implementation.

## Delivery gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `pnpm format:check` | PASS | Every matched file uses the configured Prettier style. |
| `pnpm lint` | PASS | ESLint completed without findings. |
| `pnpm typecheck` | PASS | The TypeScript project build completed without diagnostics. |
| `pnpm build` | PASS | Vite 8.2.2 transformed 153 modules and produced the production bundle. |
| `pnpm test` | PASS | 8 Vitest files and 86 tests passed. |
| Playwright matrix | PASS | 146 tests passed: 131 across the standard matrix and 15 critical journeys in Microsoft Edge; 8 project-specific profile checks were intentionally skipped outside Mobile Safari. |

The Playwright process printed a tooling-only warning that `NO_COLOR` was ignored because `FORCE_COLOR` was set. It did not come from application code or the browser console and did not affect the result.

## Design verification

The Product frames on Figma's Design page were inspected at desktop (`20620:7142`), tablet (`20655:2361`), and mobile (`20669:2202`). The Cart frames were inspected at desktop (`20620:7330`), tablet (`20655:2700`), and mobile (`20669:1010`). Visual comparisons were performed at the canonical 1920 px, 834 px, and 393 px widths.

The Product name, Product price, and Cart title now use the semantic bindings required by `DESIGN.md`: 24 px, 20 px, and 24 px respectively at every breakpoint. The tablet and mobile Figma frames use smaller 20 px Product/Cart titles and a 14 px Product price; per the repository precedence rule, the `DESIGN.md` typography bindings take priority.

The binding typography and spacing scales leave a small reported Cart discrepancy from the Figma item origin: the implementation uses 20/40/64 px vertical gaps and starts the first item at 152.8/196.8/220.8 px on mobile/tablet/desktop, while the frames place it at 152/200/229 px. All item, footer, action, edge-padding, and viewport dimensions remain at their accepted canonical values. The 768 px intermediate layout uses a 32 px footer gap until the canonical 56 px tablet gap fits at 834 px, preventing the nowrap total from causing horizontal overflow.

## Cart behavior and test ownership

Independent Playwright journeys verify both Cart identity rules through the public Product interface:

- adding the exact same Product, color, and storage selection again merges into one line and increments its quantity;
- adding two different color/storage variants of the same Product creates two separate lines, preserves each unit price, and totals both lines correctly.

The distinct-variant scenario also passed five consecutive repetitions at 393 px. Pure Cart rule tests retain coverage for identity, quantity, totals, decrement/removal, and persisted-state normalization. UI tests no longer seed, mutate, or rehydrate Zustand internals; they exercise public routes and controls instead.

## Browser and responsive coverage

The standard matrix passed 131 tests, with 7 intentional non-Safari skips, across Chromium at 393 px, 768 px, 834 px, 1280 px, and 1920 px; branded Chrome at 393 px; Firefox at 393 px; and Playwright's `iPhone 15` Mobile Safari profile. The Safari project carries the device's mobile user agent, touch support, device scale factor, screen dimensions, and WebKit engine rather than only applying a WebKit viewport. A focused profile test validates the preset contract and the independently restarted Safari context.

The 15 applicable critical journeys also passed in Microsoft Edge stable 152.0.4191.53, with the Safari-only profile check intentionally skipped, using an official package extracted to a temporary directory because the local installer requires administrator credentials. No browser was installed or changed on the host. CI explicitly installs Playwright's bundled Chromium, Firefox, and WebKit together with the branded Chrome and Edge channels before running the matrix.

Browser-problem monitoring found no unexpected console messages, page errors, error responses, or failed requests. Responsive assertions found no horizontal overflow in the Product or Cart journeys, including the 768 px intermediate case.

## Exact verification commands

- `pnpm format:check` — PASS.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS.
- `pnpm build` — PASS, 153 modules transformed.
- `pnpm test` — PASS, 8 files and 86 tests.
- `pnpm exec playwright test --project=mobile-393 --project=tablet-834 --project=intermediate-768 --project=intermediate-1280 --project=desktop-1920 --project=chrome-mobile-393 --project=firefox-mobile-393 --project=mobile-safari-iphone-15 --reporter=list` — PASS, 131 tests and 7 intentional project-specific skips.
- `pnpm exec playwright test --config=playwright.edge-local.config.ts --project=edge-mobile-393-local --reporter=list` — PASS, 15 tests and 1 intentional Safari-only skip; the temporary config changed only the Edge executable path and was removed after the run.
- `pnpm exec playwright test e2e/cart.spec.ts --project=mobile-393 --grep="different variants" --repeat-each=5 --reporter=list` — PASS, 5 consecutive runs.

## Cleanup

The unused `PageShell` abstraction was removed. Redundant store-internal Cart tests were removed while the behavior remains covered at the pure-rule and public-UI boundaries.
