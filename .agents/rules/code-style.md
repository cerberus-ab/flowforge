# Code Style and Engineering Practices

Use these rules when writing or reviewing code in this repository.

## General

- Keep modules small, explicit, and easy to reason about.
- Prefer clear domain names over generic abstractions.
- Keep one source of truth for state; avoid mirrored state unless it is intentionally derived and synchronized.
- Handle async failures at the boundary where the user or caller can act on them.
- Treat external input, selectors, page data, model output, and browser APIs as unreliable.
- Prefer typed contracts over loosely shaped objects.
- Avoid adding dependencies unless they materially reduce project complexity.
- Keep generated UI text and diagnostics concise and actionable.

## `packages/page-trail`

- Maintain strong test coverage for every behavior change.
- Cover collectors, extractors, importance scoring, semantic formatting, markdown generation, and utility edge cases.
- Use DOM fixtures for behavior that depends on real document structure.
- Test privacy and safety behavior, especially sensitive value filtering.
- Keep extraction deterministic; avoid hidden global state.
- Preserve stable output shapes because backend indexing and extension navigation depend on them.

## `apps/extension`

- Keep the extension lightweight: minimize runtime dependencies, bundle size, DOM work, and long-lived listeners.
- Keep UI components mostly presentational; place messaging, storage, and page effects in hooks or services.
- Avoid duplicated component state. Parent view models should own workflow state such as wizard progress.
- Guard async UI actions against duplicate submits, races, and unavailable content scripts.
- Keep accessibility claims truthful: do not mark UI as modal without modal behavior, and keep tabs, dialogs, buttons, and panels keyboard-accessible.
- Preserve page isolation through Shadow DOM, scoped class names, prefixed attributes, and minimal global CSS impact.
- Prefix extension-owned CSS classes, custom properties, data attributes, and DOM IDs with `flowforge`, not abbreviations like `ff`.
- Be careful with host-page selectors and DOM mutation. Escape selector values and fail safely when target elements disappear.
- Prefer Preact-compatible patterns that avoid unnecessary re-renders and expensive layout work.

## `apps/backend`

Reserved for backend-specific rules.
