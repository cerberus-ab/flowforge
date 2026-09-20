import { SELECTOR_CONTAINER } from '../selectors.ts';
import { getElementBoundingBox, isElementVisible } from './primitive/view.ts';
import { getContainerRole, roleToContainerElementType } from './primitive/role.ts';
import { getContainerElementLabels } from './primitive/label.ts';
import type { ContainerElement, ElementId } from '../../types/index.ts';
import { scoreContainerMeaning } from '../scoring/index.ts';
import type { ElementLocatorCreator } from '../ElementLocatorCreator.ts';
import { type ExtractedElement, ExtractedElements } from './ExtractedElements.ts';

// constants
const CONTAINER_MIN_AREA = 20 * 20;

/**
 * Collect visible semantic container elements from the root subtree
 *
 * Scans supported native and ARIA container selectors, filters out hidden
 * or unsupported nodes, and returns structured metadata including locator
 * info, role, type, labels, and bounding box.
 *
 */
export function extractContainerElements(
    win: Window,
    root: Element,
    nextId: () => ElementId,
    elementLocatorCreator: ElementLocatorCreator,
): ExtractedElements<ContainerElement> {
    const candidates: ExtractedElement<ContainerElement>[] = [];
    const selected = Array.from(root.querySelectorAll(SELECTOR_CONTAINER));

    selected.forEach((el) => {
        // skip hidden containers
        if (!isElementVisible(el, win)) return;
        // skip containers with no resolved role
        const role = getContainerRole(el);
        if (!role) return;
        // skip containers with no resolved type
        const type = roleToContainerElementType(role);
        if (!type) return;
        // skip too small container area
        const bbox = getElementBoundingBox(el);
        if (bbox.width * bbox.height < CONTAINER_MIN_AREA) return;

        const labels = getContainerElementLabels(el);

        candidates.push({
            el,
            data: {
                role,
                type,
                id: nextId(),
                locator: elementLocatorCreator.createFor(el),
                tag: el.tagName.toLowerCase(),
                kind: 'container',
                labels,
                bbox,
                meaningScore: scoreContainerMeaning({ role, type, labels, bbox }),
            },
        });
    });

    return new ExtractedElements(candidates, selected.length, candidates.length);
}
