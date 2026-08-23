import type { ContainerTreeNode, ContentElement, InteractiveElement } from '../../types/index.ts';
import { semInteractiveElement } from '../element/interactive.ts';
import { semContentElement } from '../element/content.ts';
import { semContainerElement } from '../element/container.ts';

// Exports

/**
 * Formats top heading elements as semantic text records.
 *
 * @param contentElements - Content elements collected from the page
 * @param limit - Maximum number of headings to include
 * @returns Heading records sorted by descending importance
 */
export function semSampleHeadings(contentElements: ContentElement[], limit = 5): string[] {
    return contentElements
        .filter((element) => element.type === 'heading')
        .sort((a, b) => b.importanceScore.value - a.importanceScore.value)
        .slice(0, limit)
        .map((element) => semContentElement(element).text());
}

/**
 * Formats meaningful text elements as semantic text records.
 *
 * @param contentElements - Content elements collected from the page
 * @param minLength - Minimum text length to include
 * @param limit - Maximum number of text records to include
 * @returns Text records sorted by descending importance
 */
export function semSampleTexts(contentElements: ContentElement[], minLength = 20, limit = 10): string[] {
    return contentElements
        .filter((element) => element.type === 'text' && element.text.length >= minLength)
        .sort((a, b) => b.importanceScore.value - a.importanceScore.value)
        .slice(0, limit)
        .map((element) => semContentElement(element).text());
}

/**
 * Formats labeled or text-bearing interactive elements as semantic text records.
 *
 * @param interactiveElements - Interactive elements collected from the page
 * @param limit - Maximum number of interactions to include
 * @returns Interaction records sorted by descending importance
 */
export function semSampleInteractions(interactiveElements: InteractiveElement[], limit = 10): string[] {
    return interactiveElements
        .filter((element) => element.labels.length > 0 || element.text)
        .sort((a, b) => b.importanceScore.value - a.importanceScore.value)
        .slice(0, limit)
        .map((element) => semInteractiveElement(element).text());
}

/**
 * Formats a depth-limited sample of the container tree.
 *
 * @param containerTree - Container tree collected from the page
 * @param maxDepth - Maximum tree depth to include
 * @param branchLimit - Maximum number of sibling containers to sample per branch
 * @returns Container sample records with depth and semantic text
 */
export function semSampleStructure(
    containerTree: ContainerTreeNode[],
    maxDepth = 3,
    branchLimit = 5,
): { depth: number; text: string }[] {
    const walkSample = (nodes: ContainerTreeNode[], level: number): { depth: number; text: string }[] => {
        if (level > maxDepth) {
            return [];
        }
        return nodes
            .slice(0, branchLimit)
            .flatMap((node) => [
                { depth: level, text: semContainerElement(node.element).text() },
                ...walkSample(node.nodes, level + 1),
            ]);
    };
    return walkSample(containerTree, 0);
}
