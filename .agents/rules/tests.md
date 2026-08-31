# Test Rules

Use these rules when adding or updating tests.

## General

- Keep tests close to the behavior they cover.
- Prefer deterministic unit tests before browser-level tests.
- Use existing fakes and fixtures before adding new helpers.
- Add dependencies only when they reduce test complexity materially.
- Keep assertions focused on observable behavior, not implementation details.
- Avoid noisy logs and unhandled async work in passing tests.
- Keep coverage strong for changed behavior, including edge and negative cases.

## `packages/page-trail`

- Use Vitest with `happy-dom`; keep tests colocated under `src/**/*.test.ts`.
- Reuse `test/fixtures.ts` and `test/domUtils.ts` instead of duplicating globalSetup.
- Cover behavior across extractors, collector, scoring, semantic formatting, and utils.
- Use Given-When-Then for new or updated tests; migrate touched tests toward it.
- Keep coverage at least at configured thresholds: 80% statements, 70% branches, 80% functions, 80% lines.

## `apps/extension`

- Use Vitest for unit, service, hook, and component tests.
- Use `happy-dom` as the DOM environment.
- Use `@testing-library/preact` for Preact hook and component behavior.
- Keep test files colocated as `*.test.ts` or `*.test.tsx`.
- Use fake transport, storage, and API clients for shared behavior.
- Test Chrome and embed adapter wiring separately from shared behavior.
- Prefer public messages, view state, DOM output, and service results in assertions.
- Prefer unit coverage for most behavior; add Playwright coverage only for key end-to-end browser scenarios.
- Use Playwright for e2e tests under `test/e2e`.
- Use the extension sandbox pages as the tested site for e2e coverage.
- Use `data-testid` locators for extension UI in Playwright tests. Avoid text, role, CSS, and structural locators unless there is no stable test id.
- Keep Chrome and embed e2e tests aligned because they cover the same product behavior with different runtime setup.
- For shared Chrome/embed e2e behavior, prefer similarly written explicit tests over over-engineered shared runners. The setup may differ; the scenario shape should stay the same.

## `apps/backend`

Reserved for backend-specific rules.

## Given-When-Then

- Structure behavior-heavy tests as Given, When, Then.
- Given sets up fakes, fixtures, initial state, DOM, and expected responses.
- When performs the user action, message dispatch, or service call.
- Then verifies state changes, returned values, sent messages, or rendered output.
- Use comments for Given, When, Then when they clarify async or multi-step tests.
- Skip the comments for trivial one-step unit tests when the structure is obvious.
