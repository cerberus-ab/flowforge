import type {
    CollectionMetadata,
    ContainerElement,
    ContainerTreeNode,
    ContentElement,
    ElementId,
    InteractiveElement,
    PageBasics,
    PageElement,
} from './types/index.ts';
import type { PageElementDto, PageTrailDto } from './types/dto.ts';
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
        readonly basics: PageBasics,
        readonly structure: ContainerTreeNode[],
        readonly elements: PageElement[],
        readonly metadata: CollectionMetadata,
    ) {}

    /**
     * Returns all content elements from the page element collection.
     * Each call returns a new array in the collected order.
     */
    content(): ContentElement[] {
        return this.elements.filter((element): element is ContentElement => element.kind === 'content');
    }

    /**
     * Returns all interactive elements from the page element collection.
     * Each call returns a new array in the collected order.
     */
    interactive(): InteractiveElement[] {
        return this.elements.filter((element): element is InteractiveElement => element.kind === 'interactive');
    }

    /**
     * Returns content elements sorted by descending importance score.
     * The original content collection keeps its collected order.
     */
    contentByImportanceDesc(): ContentElement[] {
        return this.content().sort(compareByImportanceDesc);
    }

    /**
     * Returns interactive elements sorted by descending importance score.
     * The original interactive collection keeps its collected order.
     */
    interactiveByImportanceDesc(): InteractiveElement[] {
        return this.interactive().sort(compareByImportanceDesc);
    }

    /**
     * Maps the container tree in depth-first order with optional depth and branch limits.
     * Returns a flat array of mapped values while preserving traversal order.
     */
    mapStructure<T>(mapper: (node: ContainerTreeNode, depth: number) => T, maxDepth = 3, branchLimit = 5): T[] {
        const walk = (nodes: ContainerTreeNode[], depth: number): T[] => {
            if (depth > maxDepth) return [];

            return nodes.slice(0, branchLimit).flatMap((node) => [mapper(node, depth), ...walk(node.nodes, depth + 1)]);
        };
        return walk(this.structure, 0);
    }

    /**
     * Creates a serializable DTO by replacing container references with their IDs.
     * Page elements and metadata otherwise retain their collected values.
     */
    toDto(): PageTrailDto {
        return {
            basics: this.basics,
            structure: this.structure.map(function mapNode(node): PageTrailDto['structure'][number] {
                return {
                    containerId: node.container.id,
                    nodes: node.nodes.map(mapNode),
                };
            }),
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
        const containerById = new Map(
            dto.elements
                .filter((element): element is ContainerElement => element.kind === 'container')
                .map((container) => [container.id, container]),
        );
        const resolveContainer = (containerId: ElementId): ContainerElement => {
            const container = containerById.get(containerId);
            if (!container) throw new Error(`PageTrail DTO references unknown container ID: ${containerId}`);
            return container;
        };
        const structure = dto.structure.map(function mapNode(node): ContainerTreeNode {
            return {
                container: resolveContainer(node.containerId),
                nodes: node.nodes.map(mapNode),
            };
        });
        const elements = dto.elements.map((element): PageElement => {
            if (element.kind === 'container') return element;

            return {
                ...element,
                context: {
                    ...element.context,
                    path: element.context.path.map((node) => ({
                        container: resolveContainer(node.containerId),
                        distance: node.distance,
                        relevanceScore: node.relevanceScore,
                    })),
                },
            };
        });
        return new PageTrail(dto.basics, structure, elements, dto.metadata);
    }
}
