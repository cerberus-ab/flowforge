# PageTrail

## Overview

`@flowforge/page-trail` extracts the current document into a typed `PageTrail`.
The model is DOM-focused, LLM-independent, and keeps locator data for resolving
results back to browser elements.

## Structure

`PageTrail` is the top-level snapshot object:

```ts
interface PageTrail {
    basics: PageBasics;
    container: ContainerTreeNode[];
    content: ContentElement[];
    interactive: InteractiveElement[];
    metadata: CollectionMetadata;
}
```

`basics` stores page metadata and viewport; `metadata` stores counts, limit
flags, timestamp, and per-stage timings.

## Container Elements

Container elements are visible semantic wrappers: dialogs, forms, navigation,
landmarks, sections, widgets, and tables. They are collected as a DOM-ordered
tree and are not importance-scored or limited.

Each container includes `kind`, `type`, `role`, labels, source `tag`, `dataId`,
fallback `cssSelector`, `bbox`, and `meaningScore`.

## Content Elements

Content elements are visible headings, paragraphs, list items, blockquotes, and
figcaptions. Text shorter than five characters is skipped. The default retained
limit is 250 elements after scoring.

Each content record includes source text, `tag`, `dataId`, fallback
`cssSelector`, `bbox`, container `context`, `meaningScore`, and
`importanceScore`.

## Interactive Elements

Interactive elements are visible buttons, links, inputs, textareas, selects,
summaries, dialogs, options, and supported ARIA controls. Sensitive fields are
excluded. The default retained limit is 150 elements after scoring.

Each interactive record includes `role`, text, labels, state, visibility,
optional link metadata, `dataId`, fallback `cssSelector`, `bbox`, context, and
scores.

## Context

Content and interactive targets store a container path from the nearest ancestor
toward the page root. Path nodes include the container, distance, and
`relevanceScore`; breadcrumb indexes identify the strongest context entries.

## Scoring

Scores are normalized to `[0..1]`:

- `meaningScore` describes an element by itself. Containers use type, role,
  labels, and size; content uses type and text length; interactive elements use
  type, role, name, usability, required state, and size.
- `relevanceScore` scores one container for one target from container meaning,
  distance, and target/container fit.
- `contextScore` aggregates the strongest relevant containers on a target path
  and stores breadcrumb indexes for semantic context.
- `importanceScore` ranks content and interactive targets from `meaningScore`
  plus a context boost; context cannot make a meaningless target important.

## Format

Semantic helpers are exported from the package root:

```ts
semContentElement(contentElement).text();
semInteractiveElement(interactiveElement).text();
semContainerElement(containerElement).text();
semSamplePageStructure(pageTrail.container);
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
