# Final delivery verification

Reconciled for [issue #22](https://github.com/paularg/zara-challenge-smartphone/issues/22) on 2026-08-29 against the final integrated application SHA `eef507afb51869bb2a508022a6667128d1cfd15c` on `dev`. The documentation-only reconciliation commit records evidence for that integrated application tree and does not alter its behavior.

## Integrated delivery gate

The complete configured gate ran as five independent jobs in [Quality run 33266444173](https://github.com/paularg/zara-challenge-smartphone/actions/runs/33266444173) for that exact SHA. All five jobs completed successfully.

| Gate | Local result | Integrated CI evidence |
| --- | --- | --- |
| `pnpm format:check` | PASS — every matched file used the configured Prettier style. | `format` passed. |
| `pnpm lint` | PASS — ESLint completed without findings. | `lint` passed. |
| `pnpm typecheck` | PASS — TypeScript completed without diagnostics. | `type-and-build` passed. |
| `pnpm build` | PASS — Vite 8.2.2 transformed 153 modules and produced the production bundle. | `type-and-build` passed. |
| `pnpm test` | PASS — 8 Vitest files and 86 tests passed. | `unit-and-integration` passed. |
| `pnpm test:e2e` | BLOCKED — 131 tests passed and 7 Safari-profile checks were intentionally skipped; the 16 Edge entries could not launch because Edge is not installed and the installer requires an interactive administrator password. | `end-to-end` passed — 146 tests passed in 4.1 minutes and 8 non-applicable project-specific profile checks were skipped. |

The local Edge limitation is a host constraint rather than an application failure. The same configured `edge-mobile-393` project passed all 15 applicable critical journeys in CI, where the workflow deterministically installed Microsoft Edge before running Playwright. No local browser or system setting was changed.

The local Playwright process emitted the tooling-only warning that `NO_COLOR` was ignored because `FORCE_COLOR` was set. The successful CI run also warned that the upload step found no `playwright-report/` directory because the CI reporter is `list` plus `github`, and GitHub reported deprecation notices for actions that still target Node.js 20 while the runner forced Node.js 24. None came from application code or a browser page, and none changed the gate result.

## Automated browser evidence

The configured matrix covered:

- Chromium at 393 × 852, 768 × 1024, 834 × 1194, 1280 × 800, and 1920 × 1080;
- branded Google Chrome, Microsoft Edge, and Firefox at 393 × 852 for every `@critical` journey;
- Safari-compatible WebKit using Playwright's complete `iPhone 15` device profile, including its 393 × 659 viewport, mobile user agent, touch support, device scale factor, and screen dimensions.

The 146 passing CI tests cover Catalog, Search, Product detail, optional specifications, unavailable Product configurations, pointer and keyboard Product variant selection, similar Products, exact-repeat Cart merging, distinct Product variants, Cart persistence and pricing, decrementing and empty Cart, navigation and history, loading and recovery states, malformed persisted data, failed imagery, canonical geometry, and intermediate-width overflow. The eight skips are the Mobile Safari profile-contract test outside its one applicable project.

Every exercised browser journey installs continuous monitoring before navigation. Unexpected console errors or warnings, uncaught page errors, HTTP responses at or above 400, and failed requests fail the test unless a recovery scenario explicitly declares that boundary outcome. No unexpected browser problem was reported in the passing matrix.

Axe scans with the `wcag2a`, `wcag2aa`, and `wcag22aa` tags reported no violations in the exercised states. The matrix also passed keyboard operation, accessible names and states, visible focus, the skip link, live announcements, reduced motion, the unavailable-configuration recovery action, and the disabled checkout explanation.

## Separate live-API browser journey

The local application was exercised separately in the Codex in-app browser at 393 × 852 with the challenge API. Vite loaded the real `API_KEY` from the ignored `.env` file; the value was not read, printed, copied into repository files, or included in this report.

The 2026-08-29 live journey produced this evidence:

1. Catalog loaded 20 normalized Products.
2. Searching for `iPhone` updated the URL to `/?search=iPhone` and returned two Products.
3. Opening `APL-IP13-128` rendered the Apple iPhone 13 detail instead of the former invalid-payload state. The page showed the available supported specifications and omitted the absent Screen refresh rate row.
4. The detail exposed six colors, three storage configurations, and six similar Products.
5. Selecting `256 GB` and `Medianoche` completed the Product variant, changed the image alternative to `Apple iPhone 13 in Medianoche`, enabled Add to cart, and displayed the storage option's final price of 729 EUR.
6. Adding navigated to `/cart` with one line, quantity 1, the selected variant data, a 729 EUR total, and the disabled checkout explanation.
7. Reloading `/cart` preserved the line, quantity, captured price, and total without a Product-detail refetch.
8. Removing one unit produced Cart (0), removed the payment control, exposed Continue shopping, and announced that the Cart was empty.

The live tab recorded zero console warnings or errors, reached no visible network-failure state, and displayed usable Product imagery throughout the inspected journey. The live check did not inspect or retain request headers. Deterministic browser tests remain the authoritative failed-request and HTTP-error monitor; the challenge API and image hosts remain external availability dependencies during live use.

## Figma and responsive source status

The [Zara Web Challenge Figma copy](https://www.figma.com/design/VdsDHrO5kzCWE4tplpRnLP/Labs---Zara-Web-Challenge--Smartphones---Copia-) was available through Figma MCP during this reconciliation. The `Design` page (`20602:154392`) still exposed its desktop (`20620:9054`), tablet (`20669:2483`), and mobile (`20669:2484`) sections, including the Catalog, Product detail, similar Products, filled Cart, and empty Cart frames.

`DESIGN.md` remains the design-system source of truth and Figma remains the screen-composition source of truth. The canonical 1920 px, 834 px, and 393 px compositions passed the automated geometry, typography, accessibility, and overflow checks after the corrective work in [#21](https://github.com/paularg/zara-challenge-smartphone/issues/21). The known binding-source differences remain recorded in [`docs/issue-21-verification.md`](issue-21-verification.md): `DESIGN.md` typography takes precedence over smaller Product and Cart text in the tablet/mobile frames, and small first-item vertical-origin differences remain while the binding spacing scale and all accepted viewport dimensions are preserved. There is no remaining Figma-access constraint.

## Review and delivery history

The implementation was not left uncommitted as requested by user story 64 in [issue #1](https://github.com/paularg/zara-challenge-smartphone/issues/1). It was delivered through reviewed merge commits in [PR #11](https://github.com/paularg/zara-challenge-smartphone/pull/11), [#12](https://github.com/paularg/zara-challenge-smartphone/pull/12), [#13](https://github.com/paularg/zara-challenge-smartphone/pull/13), [#14](https://github.com/paularg/zara-challenge-smartphone/pull/14), [#15](https://github.com/paularg/zara-challenge-smartphone/pull/15), [#16](https://github.com/paularg/zara-challenge-smartphone/pull/16), [#17](https://github.com/paularg/zara-challenge-smartphone/pull/17), [#18](https://github.com/paularg/zara-challenge-smartphone/pull/18), and [#19](https://github.com/paularg/zara-challenge-smartphone/pull/19), followed by corrective issue [#20](https://github.com/paularg/zara-challenge-smartphone/issues/20) in [PR #23](https://github.com/paularg/zara-challenge-smartphone/pull/23) and corrective issue [#21](https://github.com/paularg/zara-challenge-smartphone/issues/21) in the final integrated review trail, [PR #24](https://github.com/paularg/zara-challenge-smartphone/pull/24).

Issue #22 accepts that committed-delivery difference as a workflow deviation. Published history is intentionally preserved: no commit was rewritten or discarded merely to simulate an uncommitted handoff, and the merge, corrective-review, and successful CI evidence remain available.

## Remaining constraints and repository audit

- The direct-browser architecture deliberately exposes `API_KEY` in the client bundle and request headers. [ADR-0001](adr/0001-call-challenge-api-from-the-browser.md) accepts this only for the technical exercise; production credentials require a server-side boundary.
- The challenge API described by the repository's [OpenAPI contract](../openapi.json) and its external Product image hosts can change or become unavailable independently of the repository. Automated tests isolate both boundaries; live Product ordering, prices, option sets, images, and payload shapes may change after this dated verification. The current live payload evidence is recorded in [issue #20 verification](issue-20-verification.md).
- Microsoft Edge is not installed on the local macOS host, and Playwright's branded installer requires interactive administrator authorization. The constraint and prior local workaround are recorded in [issue #21 verification](issue-21-verification.md); Edge passed in the linked Quality run, which installs the channel deterministically.
- Checkout, deployment, hosting configuration, SSR, a backend-for-frontend, additional filters, and pagination remain intentionally outside scope. No deployment was performed.
- The successful CI run did not upload an HTML Playwright artifact because no report directory existed for the configured CI reporters. The job logs and GitHub annotations remain available from the linked run.

The final tracked tree was audited for secrets, starter artifacts, deployment configuration, and unrelated changes. `.env` remains ignored, `.env.example` contains only setup placeholders, no API key is tracked, the Vite starter UI and assets are absent, no deployment configuration exists, and generated `dist`, `playwright-report`, and `test-results` directories remain ignored rather than committed.
