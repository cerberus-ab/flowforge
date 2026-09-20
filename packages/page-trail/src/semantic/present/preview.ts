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
}

interface PreviewStructure {
    nodes: PresentPreviewContainerTreeNode[];
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

function presentPreviewContainerTree(structure: ContainerTreeNode[]): PresentPreviewContainerTreeNode[] {
    return structure.map((node) => ({
        tag: node.container.tag,
        role: node.container.role,
        labels: node.container.labels.map((label) => label.value),
        semanticText: semContainerElement(node.container).text(),
        score: node.container.meaningScore.value,
        nodes: presentPreviewContainerTree(node.nodes),
    }));
}

// Exports

/**
 * Creates a compact, human-readable JSON preview of the page structure.
 */
export function presentPreviewStructure(structure: ContainerRootNode): PreviewStructure {
    return {
        semanticText: 'root',
        nodes: presentPreviewContainerTree(structure.nodes),
    };
}

/**
 * Creates a compact, human-readable JSON preview of content elements.
 */
export function presentPreviewContent(content: ContentElement[]): PresentPreviewContentElement[] {
    return content.map((element) => ({
        tag: element.tag,
        text: element.text,
        semanticText: semContentElement(element).text(),
        score: element.importanceScore.value,
        context: semElementContextByBreadcrumbs(element.context),
    }));
}

/**
 * Creates a compact, human-readable JSON preview of interactive elements.
 */
export function presentPreviewInteractive(interactive: InteractiveElement[]): PresentPreviewInteractiveElement[] {
    return interactive.map((element) => ({
        tag: element.tag,
        role: element.role,
        labels: element.labels.map((label) => label.value),
        text: element.text,
        semanticText: semInteractiveElement(element).text(),
        score: element.importanceScore.value,
        context: semElementContextByBreadcrumbs(element.context),
        link: element.link?.type,
    }));
}
