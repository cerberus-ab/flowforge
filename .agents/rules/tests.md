# Test Rules

Use these rules when adding or updating tests.

## General

- Keep tests close to the behavior they cover.
- Prefer deterministic unit tests before browser-level tests.
- Use existing fakes and fixtures before adding new helpers.
- Add dependencies only when they reduce test complexity materially.
- Keep assertions focused on observable behavior, not implementation details.
- Avoid noisy logs and unhandled async work in passing tests.

## `apps/extension`

- Use Vitest for unit, service, hook, and component tests.
- Use `happy-dom` as the DOM environment.
- Use `@testing-library/preact` for Preact hook and component behavior.
- Keep test files colocated as `*.test.ts` or `*.test.tsx`.
- Use fake transport, storage, and API clients for shared behavior.
- Test Chrome and embed adapter wiring separately from shared behavior.
- Prefer public messages, view state, DOM output, and service results in assertions.
- Do not add Playwright coverage until the scenario requires a real browser.

## Given-When-Then

- Structure behavior-heavy tests as Given, When, Then.
- Given sets up fakes, fixtures, initial state, DOM, and expected responses.
- When performs the user action, message dispatch, or service call.
- Then verifies state changes, returned values, sent messages, or rendered output.
- Use comments for Given, When, Then when they clarify async or multi-step tests.
- Skip the comments for trivial one-step unit tests when the structure is obvious.
