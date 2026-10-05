# Extension

## Purpose

Browser runtimes for the FlowForge Assistant, its embedded delivery, and an additional Page Inspector Chrome extension.

## Responsibilities

- Collect a runtime `PageTrail` from the current page
- Send Assistant questions and `PageTrailDto` data to the backend
- Render answers, highlights, wizard steps, and Inspector views
- Route messages between popup, page runtime, and backend
- Store settings and per-domain Assistant history locally

## Run

From the repository root:

```bash
npm install
npm run build -w @flowforge/extension
npm run dev -w @flowforge/extension
npm run sandbox -w @flowforge/extension
```

## Builds

- `build:chrome:assistant` → `dist/chrome/assistant`
- `build:chrome:inspector` → `dist/chrome/inspector`
- `build:chrome` — both Chrome extensions
- `build:embed` → `dist/embed`
- `build` — all extension builds

Development commands are `dev:chrome:assistant`, `dev:chrome:inspector`, and `dev:embed`.

## Load in Chrome

1. Build the required Chrome extension.
2. Open `chrome://extensions/`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select `apps/extension/dist/chrome/assistant` or `apps/extension/dist/chrome/inspector`.

The Assistant requires the backend at `http://localhost:3477`.

## Embed runtime

`build:embed` creates the bundle and declarations under `dist/embed`. `Runtime.start()` uses the backend, while `Runtime.demo()` uses predefined responses. Runtime instances expose popup, Inspector, and lifecycle methods.

Initial settings can be passed when starting the runtime:

```ts
await FlowForge.start({ settings: { theme: 'dark' } });
```

## Page Inspector

Page Inspector displays the current page's `PageTrail` locally and does not require the backend.

## Key parts

- `src/chrome/` — Assistant and Page Inspector manifests and entry points
- `src/popup/`, `src/page/`, `src/background/` — shared UI and message handling
- `src/embed/` — embedded runtime
- `src/core/`, `src/adapters/` — services and runtime boundaries

## Notes

- Sandbox runs at `http://localhost:3007` with backend and demo modes.
- Browser security limits access to restricted pages and cross-origin frames.
- See [Architecture](../../docs/architecture.md) for system design.
