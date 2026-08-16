# PageTrail

Normalized DOM snapshot used as the core input for RAG, search, and UI guidance.

## Structure

```ts
interface PageTrail {
    basics: PageBasics;
    content: ContentElement[];
    interactive: InteractiveElement[];
    metadata: CollectionMetadata;
}
```

## Content elements

Extracted from visible headings, paragraphs, list items, blockquotes, and figcaptions. Very short text is skipped. Default limit: 250.

- text
- type: heading | text
- selector, dataId, bbox
- context (path + optional sectionName)
- importanceScore [0..1]

## Interactive elements

Extracted from visible buttons, links, inputs, textarea/select/summary, and supported ARIA roles. Sensitive inputs are skipped. Default limit: 150.

- role → type (button | input | select | link)
- text + labels
- state (disabled, checked, etc)
- link (if any)
- selector, dataId, bbox
- inViewport, aboveTheFold
- context
- importanceScore [0..1]

## Context

Derived from ancestor containers such as main content, navigation, footer, dialog, form, section, and table. Optional `sectionName` is resolved from aria labels, headings, or legends.

## Importance

Heuristic scoring normalized to [0..1]. It ranks elements, applies top-N limits, and improves retrieval quality.

## Metadata

`basics` stores URL, title, description, language, and viewport. `metadata` stores selected and total element counts, limit flags, `collectedAt`, and `durationMs`.

## Usage

```ts
const pt = PageTrailCollector.collectFor(window, document, {
    getElementDataId: (el) => getOrCreateDataId(el),
});
```

## Format

Helpers convert PageTrail data into semantic strings.

```ts
formatContentElement(el);
formatInteractiveElement(el);
formatContentElementShort(el);
formatInteractiveElementShort(el);
formatSampleHeadings(el, limit);
formatSampleInteractions(el, limit);
generateSemanticMarkdown(pageTrail);
```

## Notes

- DOM → structured model (LLM-independent)
- Single-page snapshot
- Optimized for search and UI actions
- Safe by default (sensitive fields excluded)
