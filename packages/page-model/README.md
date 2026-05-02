# PageModel

Normalized representation of a web page extracted from the DOM.

Used as the core input for RAG, search, and UI guidance.

## Structure

```ts
interface PageModel {
  basics: PageBasics;
  content: ContentElement[];
  interactive: InteractiveElement[];
  timestamp: number;
}
```

## Basics
- url, title, description, language
- viewport (width, height, scroll)

## Content

Extracted from text elements (headings, paragraphs, lists, etc).

Each item:

- text
- type: heading | text 
- selector, dataId, bbox 
- context (path + optional sectionName)
- importanceScore [0..1]

Filtered:

- hidden elements
- very short text

## Interactive

Extracted from buttons, links, inputs, ARIA roles.

Each item:

- role → type (button | input | select | link)
- text + labels 
- state (disabled, checked, etc)
- link (if any)
- selector, dataId, bbox 
- inViewport, aboveTheFold 
- context 
- importanceScore [0..1]

Filtered:

- hidden elements 
- sensitive inputs (passwords, OTP, card data, etc)

## Context

Derived from ancestor containers:

- main content, navigation, footer, dialog, etc

Also resolves optional sectionName from:

- aria-labelledby / aria-label / heading / legend

## Importance

Heuristic scoring normalized to [0..1].

Used to:

- rank elements 
- apply top-N limits 
- improve retrieval quality

## Usage

```ts
const model = PageModelCollector.collectFor(window, document, {
    getElementDataId: (el) => getOrCreateDataId(el),
});
```

## Format

PageModel includes helpers to convert elements into compact semantic strings.

Used for indexing, retrieval, and tool responses.

### Content

```ts
formatContentElement(el)
```

→ heading. Pricing. in section "Plans". inside "main content"

### Interactive

```ts
formatInteractiveElement(el)
```

→ internal link. click action. name "Pricing". visible on initial screen. inside "navigation"

### Short format

```ts
formatContentElementShort(el)
formatInteractiveElementShort(el)
formatConcatElements(items)
```
Used for previews and compact lists.

## Notes

- DOM → structured model (LLM-independent)
- Single-page snapshot 
- Optimized for search and UI actions 
- Safe by default (sensitive fields excluded)