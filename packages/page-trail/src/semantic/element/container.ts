import type { ContainerElement, ContainerRootNode, ContainerTreeNode } from '../../types/index.ts';
import { SemRecord } from '../SemRecord.ts';
import { placeholder } from '../constants.ts';

// section, navigation, main content, etc.
function semContainerElementDescriptor(element: ContainerElement): string {
    return element.role;
}

// [Primary, Site links]
function semContainerElementLabels(element: ContainerElement): string[] {
    return [...element.labels.map((l) => l.value)];
}

// [10 content(s), 8 interaction(s)]
function semContainerNodeContains(node: ContainerRootNode | ContainerTreeNode): string[] {
    const contains = [];
    if (node.content.length > 0) {
        contains.push(`${node.content.length} content(s)`);
    }
    if (node.interactive.length > 0) {
        contains.push(`${node.interactive.length} interaction(s)`);
    }
    return contains;
}

// Exports

/**
 * Builds a semantic record for a container element:
 * descriptor + optional labels.
 *
 * @param element - Container element
 * @returns Semantic record
 *
 * @example
 * // -> "Navigation. Name: Primary"
 * semContainerElement(el).text()
 *
 * @example
 * // -> "Main content"
 * semContainerElement(el).text()
 */
export function semContainerElement(element: ContainerElement): SemRecord {
    return SemRecord.builder()
        .withDescriptor(semContainerElementDescriptor(element))
        .withLabels(semContainerElementLabels(element))
        .build();
}

/**
 * Builds a semantic record for a container tree node:
 * descriptor + optional labels + direct content and interaction counts.
 *
 * @param node - Container tree node
 * @returns Semantic record
 *
 * @example
 * // → "Main content. Name: Products. Contains: 2 content(s), 1 interaction(s)"
 * semContainerTreeNode(node).text()
 */
export function semContainerTreeNode(node: ContainerTreeNode): SemRecord {
    return SemRecord.builder()
        .withDescriptor(semContainerElementDescriptor(node.container))
        .withLabels(semContainerElementLabels(node.container))
        .withContains(semContainerNodeContains(node))
        .build();
}

/**
 * Builds a semantic record for the structure root with direct content and interaction counts.
 *
 * @param node - Structure root node
 * @returns Semantic record
 *
 * @example
 * // → "Root. Contains: 2 content(s), 1 interaction(s)"
 * semContainerRootNode(node).text()
 */
export function semContainerRootNode(node: ContainerRootNode): SemRecord {
    return SemRecord.builder().withDescriptor(placeholder.ROOT).withContains(semContainerNodeContains(node)).build();
}
