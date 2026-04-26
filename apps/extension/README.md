# Extension

## Purpose

Chrome extension that handles UI interaction, page data extraction, and visual guidance (highlighting and workflows) based on backend responses.

## Responsibilities

- Extract page structure (content, interactive elements, navigation)
- Send user queries and page context to backend
- Render answers in popup UI
- Highlight elements and guide workflows on the page
- Handle messaging between popup, page runtime (content scripts), and backend

## Run

```bash
npm i
npm run build
```

Development mode with auto-rebuild:

```bash
npm run dev
```

## Build Options

The extension has two build modes:

- **Chrome Extension** (`build:chrome`) — Full browser extension for Chrome
- **Embed Integration** (`build:embed`) — Standalone runtime for embedding on any website

Both builds are created by default with `npm run build`, or can be built individually.

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist/chrome`

## Sandbox (Testing Environment)

Test the embed integration locally:

```bash
npm run sandbox
```

Opens test environment at `http://localhost:3007` with:
- Live embed integration demo
- Demo mode with predefined Q&A (no backend required)
- Full backend integration mode (requires backend on http://localhost:3477)

## Key Parts

- `popup/` — user interface and interaction logic
- `page/` — DOM extraction and element highlighting
- `background/` — message routing and background services
- `chrome/` — Chrome extension specific files
- `embed/` — standalone runtime for embedding on any website

## Notes

- Chrome extension requires backend running on http://localhost:3477
- Embed integration supports both backend mode and Demo mode (predefined responses)
- Works on any website (`<all_urls>` permission)
- Limited by browser security (iframes, cross-origin content)
- See [Architecture](../../docs/ARCHITECTURE.md) for system design
