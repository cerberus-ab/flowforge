# PageTrail

## Overview

`@flowforge/page-trail` extracts the current document into a typed `PageTrail`.
The model is DOM-focused, LLM-independent, and keeps locator data for resolving
results back to browser elements.

## Format

`PageTrail` is the top-level snapshot object:

```ts
interface PageTrail {
    basics: PageBasics;
    structure: ContainerTreeNode[];
    content: ContentElement[];
    interactive: InteractiveElement[];
    metadata: CollectionMetadata;
}
```

`basics` stores page metadata and viewport; `metadata` stores counts, limit
flags, timestamp, and per-stage timings.

## Structure Elements

Container elements are visible semantic wrappers: dialogs, forms, navigation,
landmarks, sections, widgets, and tables. They are collected as a DOM-ordered
tree and are not importance-scored or limited.

Each container includes `kind`, `type`, `role`, labels, source `tag`, `dataId`,
fallback `cssSelector`, `bbox`, and `meaningScore`.

## Content Elements

Content elements are visible headings, paragraphs, list items, blockquotes, and
figcaptions. Text shorter than five characters is skipped. Retained elements
are selected after scoring.

Each content record includes source text, `tag`, `dataId`, fallback
`cssSelector`, `bbox`, container `context`, `meaningScore`, and
`importanceScore`.

## Interactive Elements

Interactive elements are visible buttons, links, inputs, textareas, selects,
summaries, dialogs, options, and supported ARIA controls. Sensitive fields are
excluded. Retained elements are selected after scoring.

Each interactive record includes `role`, text, labels, state, visibility,
optional link metadata, `dataId`, fallback `cssSelector`, `bbox`, context, and
scores.

## Context

Content and interactive targets store a container path from the nearest ancestor
toward the page root. Path nodes include the container, distance, and
`relevanceScore`; breadcrumb indexes identify the strongest context entries.

## Scoring

PageTrail computes normalized scores for standalone meaning, container context,
and query-agnostic target selection. See [Scoring](docs/scoring.md) for the
scoring flow, formulas, and diagram.

## Format

Semantic helpers are exported from the package root:

```ts
semContentElement(contentElement).text();
semInteractiveElement(interactiveElement).text();
semContainerElement(containerElement).text();
semSampleStructure(pageTrail.structure);
semMarkdown(pageTrail);
```

## Usage

```ts
import { PageTrailCollector, semMarkdown } from '@flowforge/page-trail';

const pageTrail = PageTrailCollector.collectFor(window, document, {
    getElementDataId: (el) => getOrCreateDataId(el),
});

const preview = semMarkdown(pageTrail);
```
