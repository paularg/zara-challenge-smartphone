# Conventions

This document defines implementation conventions. Repository configuration is the source of truth for formatting, scripts, aliases, and package behavior.

## General

- Keep each change focused on the requested behavior.
- Use English for identifiers, comments, tests, and user-facing copy.
- Represent every reachable loading, empty, error, and success state.

## React and UI

- Keep components responsible for interaction and rendering; place business rules in hooks, stores, services, or pure functions.
- Prefer composition and explicit props over components controlled by many boolean flags.
- Add `memo`, `useMemo`, or `useCallback` only for required reference stability or a measured rendering cost.
- Build mobile-first and preserve usability at wider viewports.
- Use semantic HTML, associated labels, accessible names, keyboard support, and visible focus states.

## TypeScript

- Preserve strict types from external input to rendered props.
- Treat external values as `unknown` and narrow or validate them at the boundary.
- Declare explicit types for exported contracts; infer local implementation types.
- Model alternatives with discriminated unions when states have different valid data.
- Prefer `type` for props and unions; use `interface` when extension is intentional.
- Prefer string unions or `as const` objects to enums.
- Use `import type` for type-only imports.
- Use assertions only when surrounding code proves the invariant.

## Naming and Exports

- Name React components and their files in `PascalCase`.
- Name other variables, functions, and files in `camelCase`.
- Prefix hooks with `use`, event props with `on`, and local event handlers with `handle`.
- Name symbols after product intent, not visual position or implementation detail.
- Use named arrow functions by default. Use declarations for hoisting, recursion, generators, or overloads.
- Prefer named exports; reserve default exports for framework entry points or an established local convention.

## Styling and Comments

- Use the configured styling system for component styles; reserve global CSS for tokens, resets, and global behavior.
- Reuse an existing UI primitive before creating an equivalent generic control.
- Write comments only for intent, constraints, or non-obvious trade-offs.
- Make every TODO state the missing decision or completion condition.

## Tests

- Test observable behavior through the module's public surface.
- Prefer integration tests for user behavior and unit tests for pure logic, state transitions, selectors, and adapters.
- Query UI by role, label, or visible text and interact as a user would.
- Mock external boundaries; keep internal collaborators real when practical.
- Use small, explicit, deterministic fixtures.
- Cover meaningful edge cases and failure recovery.
- Give every test a distinct failure signal; do not repeat the same assertion across test levels.
- Reserve end-to-end tests for critical journeys that faster tests cannot protect.
