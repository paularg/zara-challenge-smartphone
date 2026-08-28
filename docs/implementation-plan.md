# Smartphone Store implementation plan

## Outcome

Build a complete technical-test submission for browsing, searching, configuring, and adding smartphone Products to a persisted Cart. The delivery consists of source code, automated tests, continuous integration, and local setup documentation. It does not include deployment, server-side rendering, checkout, or a backend-for-frontend.

Implementation starts only after the user confirms this plan represents the shared understanding reached during the requirements interview.

## Sources of truth

Apply the sources in this order:

1. Explicit user decisions recorded during the requirements interview.
2. Repository documentation for architecture, conventions, verification, and technology choices.
3. The challenge PDF for functional requirements.
4. `DESIGN.md` for the visual system.
5. Figma for screen composition, responsive behavior, content placement, states, and navigation.
6. The OpenAPI contract and live API for external data behavior.

The live API, rather than Figma's example content, owns Product names, variants, prices, images, and specifications. This corrects stale mock values such as Figma's `1 GB` storage label when the API returns `1 TB`.

The public original Figma prototype was inspected for its desktop and mobile navigation flows. Access to the repository copy was retried successfully on 2026-08-28. The `Design` page (`20602:154392`) and its desktop (`20620:9054`), tablet (`20669:2483`), and mobile (`20669:2484`) sections were inspected directly, including Catalog, Product detail, filled Cart, and empty Cart frames. Final visual acceptance therefore uses those frames together with `DESIGN.md`; there is no remaining Figma-access constraint.

## Technology and constraints

- Keep the repository stack and versions as the source of truth: React 19, TypeScript, and Vite 8.
- Require Node.js 20.19 or newer because Vite 8 is incompatible with the PDF's tentative Node 18 suggestion.
- Use `pnpm`, as established by the lockfile.
- Use Tailwind CSS and shadcn/ui for styling and reusable primitives.
- Use Zustand for shared client state and React Hook Form when actual form lifecycle state exists.
- Use React Router for routing and history.
- Use Vitest with Testing Library for unit and integration tests.
- Use Playwright for end-to-end and responsive browser verification.
- Use Prettier for formatting and ESLint for static analysis.
- Keep all work uncommitted for review.

## Routes

| Route | Responsibility |
| --- | --- |
| `/` | Product catalog and API-backed search |
| `/?search={query}` | Shareable and restorable confirmed search |
| `/products/:productId` | Product details and Product variant selection |
| `/cart` | Persisted Cart, quantities, total, and empty state |

The header logo links to `/`, and the Cart control links to `/cart`. Detail `BACK` uses browser history with `/` as a safe fallback. `CONTINUE SHOPPING` navigates to `/`. Selecting a similar Product navigates to its detail and scrolls to the beginning of the page.

## Module boundaries

Follow the feature-first boundaries in `docs/architecture.md`:

```text
src/
├── app/                         # Router, providers, application composition
├── features/catalog/            # Catalog UI, search hook, service, contracts
├── features/productDetails/     # Detail UI, variant selection, similar Products
├── features/cart/               # Zustand store, persistence, Cart UI and rules
├── components/ui/               # shadcn-based product-agnostic primitives
├── components/shared/           # Header and proven cross-feature components
├── lib/                         # API configuration and transport integration
└── test/                        # Shared deterministic fixtures and setup
e2e/                             # Critical user journeys
```

Each feature exposes cross-boundary usage through its public `index.ts`. UI calls a feature hook or store action, which calls a service when external data is involved. Services normalize transport failures and payloads before UI code sees them.

## State ownership

Store each fact once:

| State | Owner |
| --- | --- |
| Confirmed catalog search | URL query parameter |
| Search input during debounce | Catalog component or hook |
| Remote Product data | Feature hook backed by a service |
| Selected color and storage | Product detail state |
| Cart lines and persistence | Application-level Zustand store |
| Derived count and total | Zustand selectors or pure functions |

React Context is reserved for a provider-shaped concern that Zustand or the router does not represent more clearly; it is not added speculatively.

## API integration

The browser calls `https://prueba-tecnica-api-tienda-moviles.onrender.com` directly and supplies `x-api-key`. Vite loads the value from `API_KEY` and exposes it to the application bundle deliberately for this technical exercise. The key is never hardcoded, and missing configuration fails with a clear diagnostic. The accepted trade-off is recorded in ADR-0001.

The API service must:

- treat external data as unknown and validate the fields consumed by the application;
- accept the live list response as an array despite the incorrect object schema in OpenAPI;
- fetch the complete catalog, deduplicate identical Products by `Product.id`, preserve first-seen order, and display the first 20 unique Products initially;
- apply the same deduplication to search results;
- search remotely with `search` and avoid `offset`, because the live API combines `limit` and `offset` incorrectly;
- upgrade Product image URLs from HTTP to HTTPS;
- interpret each storage option's `price` as the final unit price, not a supplement;
- normalize authentication, not-found, network, invalid-payload, and unknown failures into application-level results;
- support cancellation so obsolete search responses cannot replace newer results.

Automated tests mock this boundary. A separate manual check exercises the live API.

## Catalog behavior

- Display the first 20 unique Products in API order.
- Each card contains image, brand, name, and base price.
- The catalog uses 5, 2, and 1 columns at the canonical desktop, tablet, and mobile compositions.
- The search input writes a confirmed query to `?search=` after approximately 300 ms.
- A new search cancels its obsolete request.
- Clearing the field removes the URL parameter and restores the initial catalog.
- Search requests return and display all matching unique Products, without pagination.
- The result indicator reflects the normalized result count.
- Initial loading uses skeletons. Search loading remains discreet without blocking the input.
- Empty search results identify the query and provide a clear action.
- Failures provide an inline `RETRY` action while preserving access to search.
- Product cards navigate to their detail route.
- The mobile `FILTRAR` control is omitted because no filter behavior is required.

## Product detail behavior

- Render Product name, brand, specifications, base price, colors, storage options, and similar Products from the API.
- Start with no selected color and no selected storage.
- Show the first color's image initially without marking that color as selected.
- Display `From {basePrice} EUR` before storage selection.
- Selecting storage displays that option's final `{price} EUR` value.
- Selecting color changes the main image and exposes its accessible name.
- Treat storage and color selectors as named, keyboard-operable option groups.
- Enable `ADD TO CART` only after both selections exist.
- Adding creates or merges the exact Product variant in the Cart and navigates to `/cart`.
- Render loading skeletons and recoverable error or not-found states with `RETRY` and `BACK TO CATALOG`.
- Reserve failed-image geometry and provide a useful textual alternative.
- Render similar Products as the clipped horizontal carousel described in `DESIGN.md`.
- Omit the similar Products section when the API returns none.

## Cart behavior

A Product variant is identified by Product, color, and storage. Adding the exact same Product variant increments the quantity of its existing Cart line. A different color or storage creates another Cart line.

- Persist versioned Cart data in `localStorage` without expiration.
- Recover incompatible or corrupt persisted data as an empty Cart without breaking the application.
- Persist a snapshot of Product presentation data, selected options, and unit price.
- Do not reprice an existing Cart line when remote Product data changes.
- Display Product image, name, selected storage and color, unit price, and `QTY`.
- The header count is the sum of Cart line quantities.
- The total is the sum of `unitPrice × quantity` across all lines.
- `REMOVE` decrements one unit; it removes the Cart line when quantity reaches zero.
- Match Figma's filled and empty Cart compositions at all canonical widths.
- `CONTINUE SHOPPING` returns to `/`.
- Include the Figma `PAY` control in a disabled state with an accessible explanation that checkout is outside this exercise.

## Visual implementation

Follow `DESIGN.md` exactly for tokens, typography, spacing, borders, states, and component treatment. Follow the Figma frames for composition and navigation.

- Preserve the monochrome, flat interface, square corners, hairline rules, and product-led photography.
- Use Helvetica Neue with the documented fallback.
- Implement mobile-first.
- Treat 393 px, 834 px, and 1920 px as exact visual checkpoints.
- Also validate 768 px and 1280 px for stable transitions and overflow.
- Use API content in the Figma composition rather than copying example Product values.
- Use English for interface copy and `{amount} EUR` for prices.
- Preserve API-provided commercial names without translation.

## Accessibility

Target WCAG 2.2 AA:

- semantic landmarks, headings, links, buttons, lists, and form labels;
- complete keyboard operation and visible focus;
- accessible names and states for bag count, storage options, color swatches, retry actions, and disabled checkout;
- polite live announcements for result count and Cart changes;
- useful image alternatives and decorative-image handling;
- sufficient contrast in default, hover, active, focus, disabled, and destructive states;
- no interaction that depends on color, hover, pointer accuracy, or animation alone;
- appropriate reduced-motion behavior if any motion is introduced.

## Tests

### Unit

- payload validation and normalization;
- Product deduplication and HTTP-to-HTTPS image normalization;
- Product variant identity;
- unit-price selection and EUR formatting;
- Cart merge, decrement, removal, count, and total;
- persistence migration and corrupt-data recovery.

### Integration

- initial, loading, success, empty, and error catalog states;
- debounced URL-backed search and stale-request cancellation;
- detail loading, error, selection, price, image, and CTA state;
- Cart hydration, merging, persistence, removal, and empty state;
- keyboard operation and accessible announcements.

### End to end

- catalog to detail to Cart journey;
- search, clear, back, forward, refresh, and deep links;
- selecting and adding different variants;
- merging and decrementing the same variant;
- Cart persistence across reload;
- error and recovery flows with mocked API responses;
- desktop, tablet, and mobile critical journeys;
- console errors, warnings, and unexpected failed requests.

## Continuous integration

Add GitHub Actions that install with the lockfile and run independent gates for:

1. Prettier check;
2. ESLint;
3. TypeScript and production build;
4. Vitest unit and integration tests;
5. Playwright end-to-end tests.

CI uses a non-secret placeholder key because network calls are mocked. It does not deploy anything.

## Documentation

Replace the starter README with an English project README covering:

- Node and `pnpm` prerequisites;
- `API_KEY` setup using `.env.example`;
- development, formatting, linting, build, test, and E2E commands;
- architecture and feature boundaries;
- state ownership and Cart persistence;
- direct browser API access and the ADR trade-off;
- observed API defects and normalization behavior;
- accessibility target and verified viewports;
- the absence of deployment, SSR, and checkout behavior.

## Implementation sequence

1. Install and configure the documented stack, scripts, formatting, tests, routing, Tailwind, shadcn/ui, and CI.
2. Establish global design tokens, fonts, resets, UI primitives, application shell, header, and routes.
3. Implement API configuration, runtime payload validation, failure normalization, image URL repair, and deterministic fixtures.
4. Implement the catalog and URL-backed remote search with all asynchronous states.
5. Implement Product details, Product variant selection, pricing, image changes, and similar Products.
6. Implement the Zustand Cart, versioned persistence, merge/decrement rules, derived values, and Cart screens.
7. Complete responsive composition and interaction states against Figma and `DESIGN.md`.
8. Complete WCAG 2.2 AA behavior and keyboard testing.
9. Add unit, integration, and end-to-end coverage.
10. Replace the README and run the complete verification gate.

## Acceptance gate

The delivery is complete only when:

- formatting, lint, TypeScript/build, Vitest, and Playwright pass independently;
- primary journeys, deep links, history, persistence, errors, and recovery work in a real browser;
- 393 px, 834 px, and 1920 px match their Figma compositions;
- 768 px and 1280 px remain usable without clipping or layout failure;
- WCAG 2.2 AA checks and keyboard journeys pass;
- the browser console contains no errors, warnings, or unexpected failed requests;
- every changed file and remaining external risk is reported;
- all changes remain uncommitted for user review.
