import type {
    ContainerElement,
    ContainerPathNode,
    ContainerRootNode,
    ContainerTreeNode,
    ContentElement,
    ElementContext,
    InteractiveElement,
} from '../../types/index.ts';
import { semContainerElement } from '../element/container.ts';
import { semContentElement } from '../element/content.ts';
import { semInteractiveElement } from '../element/interactive.ts';
import { placeholder } from '../constants.ts';

type PresentEnrichedContainerElement = ContainerElement & { semanticText: string };
type PresentEnrichedContainerPathNode = Omit<ContainerPathNode, 'container'> & {
    container: PresentEnrichedContainerElement;
};
type PresentEnrichedContainerTreeNode = Omit<ContainerTreeNode, 'container' | 'nodes'> & {
    container: PresentEnrichedContainerElement;
    nodes: PresentEnrichedContainerTreeNode[];
};
type PresentEnrichedStructure = {
    nodes: PresentEnrichedContainerTreeNode[];
    semanticText: string;
};
type PresentEnrichedElementContext = Omit<ElementContext, 'path'> & { path: PresentEnrichedContainerPathNode[] };
type PresentEnrichedContentElement = Omit<ContentElement, 'context'> & {
    context: PresentEnrichedElementContext;
    semanticText: string;
};
type PresentEnrichedInteractiveElement = Omit<InteractiveElement, 'context'> & {
    context: PresentEnrichedElementContext;
    semanticText: string;
};

function presentEnrichedContainerElement(containerElement: ContainerElement): PresentEnrichedContainerElement {
    return {
        ...containerElement,
        semanticText: semContainerElement(containerElement).text(),
    };
}

function presentEnrichedContainerPath(path: ContainerPathNode[]): PresentEnrichedContainerPathNode[] {
    return path.map((pathNode) => ({
        ...pathNode,
        container: presentEnrichedContainerElement(pathNode.container),
    }));
}

function presentEnrichedElementContext(context: ElementContext): PresentEnrichedElementContext {
    return {
        ...context,
        path: presentEnrichedContainerPath(context.path),
    };
}

function presentEnrichedContainerTree(container: ContainerTreeNode[]): PresentEnrichedContainerTreeNode[] {
    return container.map((containerNode) => ({
        ...containerNode,
        container: presentEnrichedContainerElement(containerNode.container),
        nodes: presentEnrichedContainerTree(containerNode.nodes),
    }));
}

// Exports

/**
 * Adds semantic text to each container tree node.
 *
 * Preserves the tree shape and enriches every container element recursively.
 */
export function presentEnrichedStructure(structure: ContainerRootNode): PresentEnrichedStructure {
    return {
        semanticText: placeholder.ROOT,
        nodes: presentEnrichedContainerTree(structure.nodes),
    };
}

/**
 * Adds semantic text to content elements and their context paths.
 *
 * Each content element gets its own semantic text, and each path container is
 * enriched with the container semantic text used to describe its surroundings.
 */
export function presentEnrichedContent(content: ContentElement[]): PresentEnrichedContentElement[] {
    return content.map((contentElement) => ({
        ...contentElement,
        context: presentEnrichedElementContext(contentElement.context),
        semanticText: semContentElement(contentElement).text(),
    }));
}

/**
 * Adds semantic text to interactive elements and their context paths.
 *
 * Each interactive element gets its own semantic text, and each path container
 * is enriched so callers can render the element with readable context.
 */
export function presentEnrichedInteractive(interactive: InteractiveElement[]): PresentEnrichedInteractiveElement[] {
    return interactive.map((interactiveElement) => ({
        ...interactiveElement,
        context: presentEnrichedElementContext(interactiveElement.context),
        semanticText: semInteractiveElement(interactiveElement).text(),
    }));
}
