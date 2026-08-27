# Agent Instructions

## Delivery

- Leave every change uncommitted in the working tree for user review.
- Create a commit or pull request only when the user explicitly requests that action.

## Design Source of Truth

- **Design system** — Before every UI or styling task, read [`DESIGN.md`](DESIGN.md) in full and follow it exactly. Treat its visual language, tokens, typography, colors, spacing, component treatments, states, and design rules as binding specifications.
- **Figma frames** — For the same task, inspect the relevant frames in the [Zara Web Challenge design](https://www.figma.com/design/VdsDHrO5kzCWE4tplpRnLP/Labs---Zara-Web-Challenge--Smartphones---Copia-) through the Figma MCP and reproduce their screen-specific composition exactly. Use Figma as the source of truth for layout, positioning, dimensions, responsive behavior, assets, content, and interactions.
- **Precedence** — Apply `DESIGN.md` to the design system and Figma to screen-specific composition. If they conflict within the same concern, follow `DESIGN.md` and report the discrepancy.

## Context Router

Read only the documents triggered by the task. Read every matching document before editing when a task spans multiple areas.

- **Architecture** — Read [`docs/architecture.md`](docs/architecture.md) before changing module boundaries, dependency direction, ownership, data flow, public feature APIs, shared abstractions, or dependencies.
- **Conventions** — Read [`docs/conventions.md`](docs/conventions.md) before changing source code, UI, styles, types, tests, naming, accessibility, or user-facing copy.
- **Verification** — Read [`docs/verification.md`](docs/verification.md) before validating or reporting any repository change as complete.

Skip these documents for inspection-only work unless they are needed to answer accurately.
