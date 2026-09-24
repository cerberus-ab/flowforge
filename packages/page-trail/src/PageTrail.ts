import type {
    CollectionMetadata,
    ContainerElement,
    ContainerRootNode,
    ContainerTreeNode,
    ContentElement,
    ElementId,
    InteractiveElement,
    PageBasics,
    PageElement,
} from './types/index.ts';
import type { ContainerTreeNodeDto, PageElementDto, PageTrailDto } from './types/dto.ts';
import { compareByImportanceDesc } from './utils/comparator.ts';

/**
 * Runtime representation of a collected web page.
 *
 * Keeps all page elements in one collection and uses direct container references
 * in the structure and target contexts. Use DTO conversion at serialization boundaries.
 */
export class PageTrail {
    /**
     * Creates a runtime page representation from collected elements and their container tree.
     * Container references are expected to point to elements from the supplied collection.
     */
    constructor(
        readonly contextOnly: boolean,
        readonly basics: PageBasics,
        private readonly structure: ContainerRootNode,
        private readonly elements: PageElement[],
        readonly metadata: CollectionMetadata,
    ) {}

    /**
     * Returns all content elements from the page element collection.
     * Each call returns a new array in the collected order.
     */
    getContent(): ContentElement[] {
        return this.elements.filter((element): element is ContentElement => element.kind === 'content');
    }

    /**
     * Returns all interactive elements from the page element collection.
     * Each call returns a new array in the collected order.
     */
    getInteractive(): InteractiveElement[] {
        return this.elements.filter((element): element is InteractiveElement => element.kind === 'interactive');
    }

    /**
     * Returns a new container structure.
     * Preserves references to its elements.
     */
    getStructure(): ContainerRootNode {
        const mapNode = (node: ContainerTreeNode): ContainerTreeNode => ({
            ...node,
            content: [...node.content],
            interactive: [...node.interactive],
            nodes: node.nodes.map(mapNode),
        });
        return {
            content: [...this.structure.content],
            interactive: [...this.structure.interactive],
            nodes: this.structure.nodes.map(mapNode),
        };
    }

    /**
     * Returns content elements sorted by descending importance score.
     * The original content collection keeps its collected order.
     */
    getContentByImportanceDesc(): ContentElement[] {
        return this.getContent().sort(compareByImportanceDesc);
    }

    /**
     * Returns interactive elements sorted by descending importance score.
     * The original interactive collection keeps its collected order.
     */
    getInteractiveByImportanceDesc(): InteractiveElement[] {
        return this.getInteractive().sort(compareByImportanceDesc);
    }

    /**
     * Returns a new container structure with content and interactive elements
     * sorted by descending importance at every level.
     */
    getStructureByImportanceDesc(): ContainerRootNode {
        const mapNode = (node: ContainerTreeNode): ContainerTreeNode => ({
            ...node,
            content: [...node.content].sort(compareByImportanceDesc),
            interactive: [...node.interactive].sort(compareByImportanceDesc),
            nodes: node.nodes.map(mapNode),
        });
        return {
            content: [...this.structure.content].sort(compareByImportanceDesc),
            interactive: [...this.structure.interactive].sort(compareByImportanceDesc),
            nodes: this.structure.nodes.map(mapNode),
        };
    }

    /**
     * Maps the structure root and its container nodes in depth-first order.
     * The root has depth zero and is always included; depth and branch limits
     * apply to descendant container nodes.
     */
    mapStructureTree<T>(
        mapper: (node: ContainerRootNode | ContainerTreeNode, depth: number) => T,
        maxDepth = 3,
        branchLimit = 5,
    ): T[] {
        const data = [mapper(this.structure, 0)];

        const walk = (nodes: ContainerTreeNode[], depth: number): T[] => {
            if (depth > maxDepth) return [];

            return nodes.slice(0, branchLimit).flatMap((node) => [mapper(node, depth), ...walk(node.nodes, depth + 1)]);
        };
        data.push(...walk(this.structure.nodes, 1));
        return data;
    }

    /**
     * Creates a serializable DTO by replacing container references with their IDs.
     * Page elements and metadata otherwise retain their collected values.
     */
    toDto(): PageTrailDto {
        const mapNode = (node: ContainerTreeNode): ContainerTreeNodeDto => ({
            containerId: node.container.id,
            contentIds: node.content.map((element) => element.id),
            interactiveIds: node.interactive.map((element) => element.id),
            nodes: node.nodes.map(mapNode),
        });

        return {
            contextOnly: this.contextOnly,
            basics: this.basics,
            structure: {
                contentIds: this.structure.content.map((element) => element.id),
                interactiveIds: this.structure.interactive.map((element) => element.id),
                nodes: this.structure.nodes.map(mapNode),
            },
            elements: this.elements.map((element): PageElementDto => {
                if (element.kind === 'container') return element;

                return {
                    ...element,
                    context: {
                        ...element.context,
                        path: element.context.path.map((node) => ({
                            containerId: node.container.id,
                            distance: node.distance,
                            relevanceScore: node.relevanceScore,
                        })),
                    },
                };
            }),
            metadata: this.metadata,
        };
    }

    /**
     * Restores a runtime PageTrail and reconnects tree and context references to containers.
     * Container instances are taken from the DTO element collection.
     */
    static fromDto(dto: PageTrailDto): PageTrail {
        const elementById = new Map<ElementId, PageElement>();
        for (const element of dto.elements) {
            if (element.kind === 'container') elementById.set(element.id, element);
        }

        const resolveElement = <T extends PageElement>(elementId: ElementId): T => {
            const element = elementById.get(elementId);
            if (!element) throw new Error(`PageTrail DTO references unknown element ID: ${elementId}`);
            return element as T;
        };

        const elements = dto.elements.map((element): PageElement => {
            if (element.kind === 'container') return element;

            const restored: ContentElement | InteractiveElement = {
                ...element,
                context: {
                    ...element.context,
                    path: element.context.path.map((node) => ({
                        container: resolveElement<ContainerElement>(node.containerId),
                        distance: node.distance,
                        relevanceScore: node.relevanceScore,
                    })),
                },
            };
            elementById.set(restored.id, restored);
            return restored;
        });

        const mapNode = (node: ContainerTreeNodeDto): ContainerTreeNode => {
            return {
                container: resolveElement<ContainerElement>(node.containerId),
                content: node.contentIds.map((id) => resolveElement<ContentElement>(id)),
                interactive: node.interactiveIds.map((id) => resolveElement<InteractiveElement>(id)),
                nodes: node.nodes.map(mapNode),
            };
        };
        const structure: ContainerRootNode = {
            content: dto.structure.contentIds.map((id) => resolveElement<ContentElement>(id)),
            interactive: dto.structure.interactiveIds.map((id) => resolveElement<InteractiveElement>(id)),
            nodes: dto.structure.nodes.map(mapNode),
        };
        return new PageTrail(dto.contextOnly, dto.basics, structure, elements, dto.metadata);
    }
}
