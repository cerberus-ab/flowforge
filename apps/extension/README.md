# Extension

## Purpose

Chrome extension that handles UI interaction, page data extraction, and visual guidance (highlighting and workflows) based on backend responses.

## Responsibilities

- Extract page structure (content, interactive elements, navigation)
- Send user queries and page context to backend
- Render answers in popup UI
- Highlight elements and guide workflows on the page
- Handle messaging between popup, content scripts, and backend

## Run (standalone)

```bash
npm i
npm run build
```

Development mode with auto-rebuild:

```bash
npm run dev
```

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist/chrome`

## Key Parts

- `popup/` — user interface and interaction logic
- `page/` — DOM extraction and element highlighting
- `background/` — message routing and extension lifecycle

## Notes

- Requires backend running on http://localhost:3477
- Works on any website (`<all_urls>` permission)
- Limited by browser security (iframes, cross-origin content)
- See [Architecture](../../docs/ARCHITECTURE.md) for system design
