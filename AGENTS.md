# Agent Instructions

## Delivery

- Leave every change uncommitted in the working tree for user review.
- Create a commit or pull request only when the user explicitly requests that action.

## Context Router

Read only the documents triggered by the task. Read every matching document before editing when a task spans multiple areas.

- **Architecture** — Read [`docs/architecture.md`](docs/architecture.md) before changing module boundaries, dependency direction, ownership, data flow, public feature APIs, shared abstractions, or dependencies.
- **Conventions** — Read [`docs/conventions.md`](docs/conventions.md) before changing source code, UI, styles, types, tests, naming, accessibility, or user-facing copy.
- **Verification** — Read [`docs/verification.md`](docs/verification.md) before validating or reporting any repository change as complete.

Skip these documents for inspection-only work unless they are needed to answer accurately.
