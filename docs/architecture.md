# Architecture

This document defines the target stack, module boundaries, ownership, and data flow. Repository configuration is the source of truth for versions and current installation.

## Stack

- Use React with TypeScript and Vite for the application and build.
- Use Tailwind CSS and shadcn/ui for styling and UI primitives.
- Use Zustand for shared client state and React Hook Form for form state.
- Use Vitest with Testing Library for unit and integration tests, and Playwright for end-to-end tests.

## Principles

- Keep feature behavior, UI, state, and data access together.
- Prefer direct dependencies over wrapper layers that add no domain value.

## Boundaries

Use these directories when their responsibility exists:

```text
src/
├── app/                  # Root composition, routing, and providers
├── features/<feature>/   # Feature-owned UI, logic, state, services, and types
├── components/ui/        # Reusable UI primitives without product behavior
├── components/shared/    # Proven cross-feature components
├── lib/                  # Shared clients, adapters, and framework integration
├── test/                 # Shared test setup, factories, and fixtures
├── App.tsx               # Application shell
└── main.tsx              # Runtime entry point
e2e/                      # Application-level user journeys
```

- `app` may compose features; features must not import from `app`.
- A feature must expose cross-boundary usage through its public `index.ts` API.
- Features must not import another feature's internals. Put coordination in `app` or a small shared contract.
- Shared modules must not depend on `features` or `app`.
- `lib` must contain infrastructure, not product rules.
- Tests must stay beside the module they exercise; only shared test support belongs in `src/test`.

## State Ownership

| State | Owner |
| --- | --- |
| Component interaction | Component or local hook |
| Form lifecycle | Form boundary |
| Shareable navigation or filters | URL |
| Feature-wide client state | Feature store |
| Cross-feature client state | Application store |
| Remote data | Feature hook backed by a service |
| Derived values | Computed from source state |

Store each fact once. Do not copy remote or derived data into unrelated stores.

## Data Flow

Use one directional path:

```text
UI -> feature hook or store action -> service -> external system
```

Services must normalize external payloads and failures. UI modules must consume application-level results and remain independent of transport and persistence details.

## Change Rules

- Add a dependency only when the platform and existing packages cannot meet the requirement clearly.
- Add a shared module only after identifying its current consumers and stable responsibility.
- Document an exception beside the affected boundary when the simpler structure above cannot represent the requirement.
