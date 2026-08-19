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

export function semModelContent(content: ContentElement[]): SemanticContentElement[] {
    return content.map((contentElement) => ({
        ...contentElement,
        context: semModelElementContext(contentElement.context),
        semanticText: semContentElement(contentElement).text(),
    }));
}

export function semModelInteractive(interactive: InteractiveElement[]): SemanticInteractiveElement[] {
    return interactive.map((interactiveElement) => ({
        ...interactiveElement,
        context: semModelElementContext(interactiveElement.context),
        semanticText: semInteractiveElement(interactiveElement).text(),
    }));
}

export function semModelContainer(container: ContainerTreeNode[]): SemanticContainerTreeNode[] {
    return container.map((containerNode) => ({
        ...containerNode,
        element: semModelContainerElement(containerNode.element),
        nodes: semModelContainer(containerNode.nodes),
    }));
}
