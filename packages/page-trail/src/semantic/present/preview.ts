import type {
    ContainerRootNode,
    ContainerTreeNode,
    ContentElement,
    InteractiveElement,
    InteractiveLinkType,
} from '../../types/index.ts';
import { semContainerElement } from '../element/container.ts';
import { semContentElement } from '../element/content.ts';
import { semElementContextByBreadcrumbs } from '../element/context.ts';
import { semInteractiveElement } from '../element/interactive.ts';

interface PresentPreviewContainerTreeNode {
    tag: string;
    role: string;
    labels: string[];
    semanticText: string;
    score: number;
    nodes: PresentPreviewContainerTreeNode[];
    content: PresentPreviewContentElement[];
    interactive: PresentPreviewInteractiveElement[];
}

interface PresentPreviewStructure {
    nodes: PresentPreviewContainerTreeNode[];
    content: PresentPreviewContentElement[];
    interactive: PresentPreviewInteractiveElement[];
    semanticText: string;
}

interface PresentPreviewContentElement {
    tag: string;
    text: string;
    semanticText: string;
    score: number;
    context: string[];
}

interface PresentPreviewInteractiveElement {
    tag: string;
    role: string;
    labels: string[];
    text?: string;
    semanticText: string;
    score: number;
    context: string[];
    link?: InteractiveLinkType;
}

export function presentPreviewContentElement(element: ContentElement): PresentPreviewContentElement {
    return {
        tag: element.tag,
        text: element.text,
        semanticText: semContentElement(element).text(),
        score: element.importanceScore.value,
        context: semElementContextByBreadcrumbs(element.context),
    };
}

export function presentPreviewInteractiveElement(element: InteractiveElement): PresentPreviewInteractiveElement {
    return {
        tag: element.tag,
        role: element.role,
        labels: element.labels.map((label) => label.value),
        text: element.text,
        semanticText: semInteractiveElement(element).text(),
        score: element.importanceScore.value,
        context: semElementContextByBreadcrumbs(element.context),
        link: element.link?.type,
    };
}

function presentPreviewContainerTree(containerTree: ContainerTreeNode[]): PresentPreviewContainerTreeNode[] {
    return containerTree.map((node) => ({
        tag: node.container.tag,
        role: node.container.role,
        labels: node.container.labels.map((label) => label.value),
        semanticText: semContainerElement(node.container).text(),
        score: node.container.meaningScore.value,
        nodes: presentPreviewContainerTree(node.nodes),
        content: node.content.map(presentPreviewContentElement),
        interactive: node.interactive.map(presentPreviewInteractiveElement),
    }));
}

// Exports

/**
 * Creates a compact, human-readable JSON preview of the page structure.
 */
export function presentPreviewStructure(structure: ContainerRootNode): PresentPreviewStructure {
    return {
        semanticText: 'root',
        nodes: presentPreviewContainerTree(structure.nodes),
        content: structure.content.map(presentPreviewContentElement),
        interactive: structure.interactive.map(presentPreviewInteractiveElement),
    };
}

/**
 * Creates a compact, human-readable JSON preview of content elements.
 */
export function presentPreviewContent(content: ContentElement[]): PresentPreviewContentElement[] {
    return content.map((element) => presentPreviewContentElement(element));
}

/**
 * Creates a compact, human-readable JSON preview of interactive elements.
 */
export function presentPreviewInteractive(interactive: InteractiveElement[]): PresentPreviewInteractiveElement[] {
    return interactive.map((element) => presentPreviewInteractiveElement(element));
}
