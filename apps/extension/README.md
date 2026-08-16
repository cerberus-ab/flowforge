# Extension

## Purpose

Chrome extension and embeddable browser runtime that handle UI interaction, page data extraction, and visual guidance based on backend responses.

## Responsibilities

- Extract page structure (`PageTrail`)
- Send user queries and page context to backend
- Render answers, highlights, wizard steps, and Inspector UI
- Route messages between popup, page runtime, and backend
- Store settings and per-domain question history locally

## Run

```bash
npm i
npm run build
npm run dev
npm run sandbox
```

## Builds

- `npm run build:chrome` — Chrome extension
- `npm run build:embed` — embeddable runtime
- `npm run build` — both builds

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist/chrome`

Sandbox opens `http://localhost:3007` with demo mode and backend mode.

## Embed runtime

`build:embed` creates a bundle and declaration file under `dist/embed`:

- `Runtime.start()` — uses the local backend
- `Runtime.demo()` — uses predefined demo Q&A responses
- `openPopup()`, `closePopup()`, `openPageInspector()`, `destroy()` on runtime instances

## Key parts

- `popup/` — user interface and interaction logic
- `page/` — page overlay, highlighting, wizard, inspector, and collection hooks
- `background/`, `chrome/`, `embed/` — worker, extension shell, and embed runtime
- `core/` / `adapters/` — API, storage, locator, root injection, and transport

## Notes

- Chrome extension requires backend on http://localhost:3477
- Embed integration supports backend mode and demo mode
- Limited by browser security (iframes, cross-origin content)
- See [Architecture](../../docs/ARCHITECTURE.md) for system design
