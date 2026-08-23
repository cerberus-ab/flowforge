import type {
    ContainerElement,
    ContainerPathNode,
    ContainerTreeNode,
    ContentElement,
    ElementContext,
    InteractiveElement,
} from '../../types/index.ts';
import { semContainerElement } from '../element/container.ts';
import { semContentElement } from '../element/content.ts';
import { semInteractiveElement } from '../element/interactive.ts';

type EnrichedContainerElement = ContainerElement & { semanticText: string };
type EnrichedContainerPathNode = Omit<ContainerPathNode, 'element'> & { element: EnrichedContainerElement };
type EnrichedContainerTreeNode = Omit<ContainerTreeNode, 'element' | 'nodes'> & {
    element: EnrichedContainerElement;
    nodes: EnrichedContainerTreeNode[];
};
type EnrichedElementContext = Omit<ElementContext, 'path'> & { path: EnrichedContainerPathNode[] };
type EnrichedContentElement = Omit<ContentElement, 'context'> & {
    context: EnrichedElementContext;
    semanticText: string;
};
type EnrichedInteractiveElement = Omit<InteractiveElement, 'context'> & {
    context: EnrichedElementContext;
    semanticText: string;
};

function semModelEnrichedContainerElement(containerElement: ContainerElement): EnrichedContainerElement {
    return {
        ...containerElement,
        semanticText: semContainerElement(containerElement).text(),
    };
}

function semModelEnrichedContainerPath(path: ContainerPathNode[]): EnrichedContainerPathNode[] {
    return path.map((pathNode) => ({
        ...pathNode,
        element: semModelEnrichedContainerElement(pathNode.element),
    }));
}

function semModelEnrichedElementContext(context: ElementContext): EnrichedElementContext {
    return {
        ...context,
        path: semModelEnrichedContainerPath(context.path),
    };
}

// Exports

/**
 * Adds semantic text to each container tree node.
 *
 * Preserves the tree shape and enriches every container element recursively.
 */
export function semModelEnrichedStructure(container: ContainerTreeNode[]): EnrichedContainerTreeNode[] {
    return container.map((containerNode) => ({
        ...containerNode,
        element: semModelEnrichedContainerElement(containerNode.element),
        nodes: semModelEnrichedStructure(containerNode.nodes),
    }));
}

/**
 * Adds semantic text to content elements and their context paths.
 *
 * Each content element gets its own semantic text, and each path container is
 * enriched with the container semantic text used to describe its surroundings.
 */
export function semModelEnrichedContent(content: ContentElement[]): EnrichedContentElement[] {
    return content.map((contentElement) => ({
        ...contentElement,
        context: semModelEnrichedElementContext(contentElement.context),
        semanticText: semContentElement(contentElement).text(),
    }));
}

/**
 * Adds semantic text to interactive elements and their context paths.
 *
 * Each interactive element gets its own semantic text, and each path container
 * is enriched so callers can render the element with readable context.
 */
export function semModelEnrichedInteractive(interactive: InteractiveElement[]): EnrichedInteractiveElement[] {
    return interactive.map((interactiveElement) => ({
        ...interactiveElement,
        context: semModelEnrichedElementContext(interactiveElement.context),
        semanticText: semInteractiveElement(interactiveElement).text(),
    }));
}
