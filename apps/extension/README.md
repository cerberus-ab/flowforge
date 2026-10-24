# Extension

## Purpose

Browser runtimes for the FlowForge Assistant, its embedded delivery, and an additional Page Inspector Chrome extension.

## Responsibilities

- Collect a runtime `PageTrail` from the current page
- Send Assistant questions and `PageTrailDto` data to the backend
- Render answers, highlights, wizard steps, and Inspector views
- Route messages between popup, page runtime, and backend
- Store settings and per-domain Assistant history locally
- Restore per-page Assistant queries when the popup reopens

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

## Assistant popup

The Assistant keeps one query session per page in browser session storage: `chrome.storage.session` in Chrome and `window.sessionStorage` in embed. Reopening the popup restores a pending query while its background task is still active, or a completed answer for the same page URL. Settings and per-domain question history use separate local storage.

If the page's data-ID signature no longer matches the saved snapshot, the answer remains visible with a warning, but element actions are unavailable. **Clear result** removes the saved answer while keeping the question in the open popup. Step-by-step results start the wizard only when **Open onboarding** is clicked.

## Embed runtime

`build:embed` creates the bundle and declarations under `dist/embed`. `Runtime.start()` uses the backend, while `Runtime.demo()` uses predefined responses. Runtime instances expose popup, Inspector, and lifecycle methods.

In demo mode, `stubQA` provides the popup's available questions and answers. The question field is read-only: users can select a question from the list or use **Ask next question** to cycle through the presets. If `openPopup(question)` receives a question outside the presets, the popup shows an error until an available question is selected. Without `stubQA` questions, submission is disabled.

Initial settings can be passed when starting the runtime:

```ts
await FlowForge.start({ settings: { theme: 'dark' } });
```

## Page Inspector

Both Chrome extensions display Inspector in a tab-specific side panel using a shared UI and messaging path. Their content scripts collect Inspector data without mounting an overlay. The Assistant keeps its content script for queries, highlights, and onboarding; the embed runtime keeps its Inspector overlay.

Inspector collects and displays the current page's `PageTrail` locally without requiring the backend. Chrome and embed runtimes remember the last selected Inspector tab and Markdown detail and block settings across openings. Chrome stores settings in extension local storage; embed stores them in the host page's `localStorage`. Opening Inspector with an explicit tab, such as Markdown from the Assistant popup, selects that tab for the current opening without changing the remembered tab.

## Key parts

- `src/chrome/` — Assistant and Page Inspector manifests and entry points
- `src/popup/`, `src/page/`, `src/background/` — shared UI and message handlers
- `src/messaging/` — typed messages and routing
- `src/embed/` — embedded runtime
- `src/core/`, `src/adapters/` — services and runtime boundaries

## Notes

- Sandbox runs at `http://localhost:3007` with backend and demo modes, including controls for preset and unavailable demo questions.
- Development builds log sent and handled incoming transport messages in their browser context consoles.
- Browser security limits access to restricted pages and cross-origin frames.
- See [Architecture](../../docs/architecture.md) for system design.
