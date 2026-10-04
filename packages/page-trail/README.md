# PageTrail

## Overview

`@flowforge/page-trail` collects a document into a typed page representation.
It separates the JSON-safe `PageTrailDto` contract from the runtime `PageTrail`
model used for traversal and semantic formatting.

## Format

`PageTrailDto` is the portable snapshot sent across process boundaries:

```ts
interface PageTrailDto {
    contextOnly: boolean;
    basics: PageBasicsDto;
    structure: ContainerRootNodeDto;
    elements: PageElementDto[];
    metadata: CollectionsMetadataDto;
}
```

Every element is stored once in `elements`. Structure edges and target context
paths refer to those records by numeric element ID. `PageTrail.fromDto()`
reconnects the IDs into object references; `pageTrail.toDto()` converts the
runtime model back to its serializable form.

`basics` contains page and viewport data. `metadata` records the package version, collection counts, limits, timestamp, and stage timings.

## Structure elements

Container elements describe visible semantic wrappers such as dialogs, forms,
navigation, landmarks, sections, widgets, and tables. The runtime structure is
a rooted tree whose nodes hold direct references to their container and target
elements. The DTO represents the same links as `containerId`, `contentIds`, and
`interactiveIds`.

Containers are collected in DOM order and include `kind`, `type`, `role`,
labels, source `tag`, bounding box, and `meaningScore`.

## Content elements

Content elements represent visible headings, paragraphs, list items,
blockquotes, and figcaptions. Retained elements include text, source tag,
bounding box, container context, `meaningScore`, and `importanceScore`.

## Interactive elements

Interactive elements represent visible buttons, links, inputs, textareas,
selects, summaries, dialogs, options, and supported ARIA controls. Sensitive
fields are excluded. Records include role, text, labels, state, visibility,
optional link metadata, context, and scores.

## Context and locators

Target context contains a path from the nearest container toward the page root.
Runtime path nodes reference container objects; DTO path nodes use container
IDs. Breadcrumb indexes select the strongest entries from the full path.

Element identity and DOM lookup are separate. Every record has a numeric `id`
for relationships inside one snapshot. A DOM-linked collection also includes a
`locator` with a caller-provided `dataId` and a CSS selector fallback. In
context-only mode, locators are omitted and collection does not require DOM
identifiers.

## Scoring

PageTrail computes normalized scores for standalone meaning, container context,
and query-agnostic target selection. See [Scoring](docs/scoring.md) for the
scoring flow, formulas, and diagram.

## Runtime API

```ts
pageTrail.getContent();
pageTrail.getInteractive();
pageTrail.getStructure();
pageTrail.getContentByImportanceDesc();
pageTrail.getInteractiveByImportanceDesc();
pageTrail.getStructureByImportanceDesc();
Markdown.from(pageTrail, options);
```

## Usage

```ts
import { Markdown, PageTrail, PageTrailCollector } from '@flowforge/page-trail';

const pageTrail = PageTrailCollector.collectFor(window, document, {
    getElementDataId: (element) => getOrCreateDataId(element),
});

const dto = pageTrail.toDto();
const restored = PageTrail.fromDto(JSON.parse(JSON.stringify(dto)));

const markdown = Markdown.from(restored, { detailLevel: 'standard', blocks: ['basics', 'content'] });
const preview = markdown.toString();
```

For context without DOM resolution, collect with `{ contextOnly: true }`. Tests in consuming packages can reuse fixtures from `@flowforge/page-trail/testing`.
