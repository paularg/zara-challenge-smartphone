# Verification

Verify the final working tree before reporting a repository change as complete. Use repository configuration as the source of truth for commands.

## Gate

1. Inspect the final diff and account for every changed file, affected behavior, boundary, configuration, and user journey.
2. Map each affected behavior to the cheapest check that can detect a regression.
3. Run every applicable configured check independently after the last code change:
   - build and type-check;
   - lint and static analysis;
   - unit and integration tests;
   - end-to-end tests.
4. Confirm the diff follows every project rule triggered by the task.
5. Reinspect the working tree after verification and remove accidental artifacts.

A missing or unavailable required check is `BLOCKED`, not a pass. Fix every failure and rerun the failed check plus any downstream check the fix can affect.

## Browser Check

For changes to UI, styling, navigation, forms, accessibility, browser APIs, client state, or network behavior, validate the running application through Playwright or an equivalent real browser.

Exercise the affected primary journey and applicable loading, empty, error, validation, and recovery states. Check keyboard interaction, focus, accessible names, mobile and desktop layouts, console errors, and failed network requests. Verify persistence, refresh, history navigation, and deep links when the change affects them.

A screenshot alone does not validate behavior. Base conclusions on user-visible outcomes.

## Completion Standard

Each applicable check must end as:

- `PASS` — it ran successfully against the final change.
- `N/A` — it cannot exercise the change; record the concrete reason.
- `BLOCKED` — it could not run; report the missing capability or environment.
- `FAIL` — it found a problem; fix it before completion.

Report the exact commands and results, test counts when available, browser journeys and viewports, and every remaining warning or risk. Report a change as complete only when all applicable checks are `PASS` or justified `N/A`.
