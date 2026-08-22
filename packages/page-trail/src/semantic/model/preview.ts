import type { ContainerTreeNode, ContentElement, InteractiveElement, InteractiveLinkType } from '../../types/index.ts';
import { semContainerElement } from '../element/container.ts';
import { semContentElement } from '../element/content.ts';
import { semElementContextByBreadcrumbs } from '../element/context.ts';
import { semInteractiveElement } from '../element/interactive.ts';

interface ModelPreviewContainerTreeNode {
    tag: string;
    role: string;
    labels: string[];
    semanticText: string;
    score: number;
    nodes: ModelPreviewContainerTreeNode[];
}

interface ModelPreviewContentElement {
    tag: string;
    text: string;
    semanticText: string;
    score: number;
    context: string[];
}

interface ModelPreviewInteractiveElement {
    tag: string;
    role: string;
    labels: string[];
    text?: string;
    semanticText: string;
    score: number;
    context: string[];
    link?: InteractiveLinkType;
}

// Exports

/**
 * Creates a compact, human-readable JSON preview of the page structure.
 */
export function semModelPreviewStructure(structure: ContainerTreeNode[]): ModelPreviewContainerTreeNode[] {
    return structure.map((node) => ({
        tag: node.element.tag,
        role: node.element.role,
        labels: node.element.labels.map((label) => label.value),
        semanticText: semContainerElement(node.element).text(),
        score: node.element.meaningScore.value,
        nodes: semModelPreviewStructure(node.nodes),
    }));
}

/**
 * Creates a compact, human-readable JSON preview of content elements.
 */
export function semModelPreviewContent(content: ContentElement[]): ModelPreviewContentElement[] {
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
export function semModelPreviewInteractive(interactive: InteractiveElement[]): ModelPreviewInteractiveElement[] {
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
