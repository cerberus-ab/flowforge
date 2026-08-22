import type {
    ContainerElement,
    ContainerPathNode,
    ContainerTreeNode,
    ContentElement,
    ElementContext,
    InteractiveElement,
} from '../types/index.ts';
import { semContainerElement } from './element/container.ts';
import { semContentElement } from './element/content.ts';
import { semInteractiveElement } from './element/interactive.ts';

export type SemanticContainerElement = ContainerElement & { semanticText: string };
export type SemanticContainerPathNode = Omit<ContainerPathNode, 'element'> & { element: SemanticContainerElement };
export type SemanticContainerTreeNode = Omit<ContainerTreeNode, 'element' | 'nodes'> & {
    element: SemanticContainerElement;
    nodes: SemanticContainerTreeNode[];
};
export type SemanticElementContext = Omit<ElementContext, 'path'> & { path: SemanticContainerPathNode[] };
export type SemanticContentElement = Omit<ContentElement, 'context'> & {
    context: SemanticElementContext;
    semanticText: string;
};
export type SemanticInteractiveElement = Omit<InteractiveElement, 'context'> & {
    context: SemanticElementContext;
    semanticText: string;
};

function semModelContainerElement(containerElement: ContainerElement): SemanticContainerElement {
    return {
        ...containerElement,
        semanticText: semContainerElement(containerElement).text(),
    };
}

function semModelContainerPath(path: ContainerPathNode[]): SemanticContainerPathNode[] {
    return path.map((pathNode) => ({
        ...pathNode,
        element: semModelContainerElement(pathNode.element),
    }));
}

function semModelElementContext(context: ElementContext): SemanticElementContext {
    return {
        ...context,
        path: semModelContainerPath(context.path),
    };
}

// Exports

/**
 * Adds semantic text to each container tree node.
 *
 * Preserves the tree shape and enriches every container element recursively.
 */
export function semModelContainer(container: ContainerTreeNode[]): SemanticContainerTreeNode[] {
    return container.map((containerNode) => ({
        ...containerNode,
        element: semModelContainerElement(containerNode.element),
        nodes: semModelContainer(containerNode.nodes),
    }));
}

/**
 * Adds semantic text to content elements and their context paths.
 *
 * Each content element gets its own semantic text, and each path container is
 * enriched with the container semantic text used to describe its surroundings.
 */
export function semModelContent(content: ContentElement[]): SemanticContentElement[] {
    return content.map((contentElement) => ({
        ...contentElement,
        context: semModelElementContext(contentElement.context),
        semanticText: semContentElement(contentElement).text(),
    }));
}

/**
 * Adds semantic text to interactive elements and their context paths.
 *
 * Each interactive element gets its own semantic text, and each path container
 * is enriched so callers can render the element with readable context.
 */
export function semModelInteractive(interactive: InteractiveElement[]): SemanticInteractiveElement[] {
    return interactive.map((interactiveElement) => ({
        ...interactiveElement,
        context: semModelElementContext(interactiveElement.context),
        semanticText: semInteractiveElement(interactiveElement).text(),
    }));
}
