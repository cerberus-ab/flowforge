import type {
    CollectionMetadata,
    ContainerElement,
    ContainerPathNode,
    ContentElement,
    ElementContext,
    ElementId,
    InteractiveElement,
    PageBasics,
} from './pageTrail.ts';

// DTO types replace runtime object references with serializable element IDs.

export type PageBasicsDto = PageBasics;

export type CollectionsMetadataDto = CollectionMetadata;

export type ContainerTreeNodeDto = {
    containerId: ElementId;
    nodes: ContainerTreeNodeDto[];
};

export type ContainerPathNodeDto = Omit<ContainerPathNode, 'container'> & {
    containerId: ElementId;
};

export type ElementContextDto = Omit<ElementContext, 'path'> & {
    path: ContainerPathNodeDto[];
};

export type ContainerElementDto = ContainerElement;

export type ContentElementDto = Omit<ContentElement, 'context'> & {
    context: ElementContextDto;
};

export type InteractiveElementDto = Omit<InteractiveElement, 'context'> & {
    context: ElementContextDto;
};

export type PageElementDto = ContainerElementDto | ContentElementDto | InteractiveElementDto;

/**
 * Serializable representation of PageTrail.
 * Container tree and context relationships are stored as element IDs.
 */
export interface PageTrailDto {
    basics: PageBasicsDto;
    structure: ContainerTreeNodeDto[];
    elements: PageElementDto[];
    metadata: CollectionsMetadataDto;
}
