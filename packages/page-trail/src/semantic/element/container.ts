import type { ContainerElement } from '../../types/index.ts';
import { SemRecord } from '../SemRecord.ts';

// section, navigation, main content, etc.
function semContainerElementDescriptor(element: ContainerElement): string {
    return element.role;
}

// [Primary, Site links]
function semContainerElementLabels(element: ContainerElement): string[] {
    return [...element.labels.map((l) => l.value)];
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
