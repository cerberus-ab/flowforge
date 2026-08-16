import { getContainerRole } from './role.ts';
import { SELECTOR_HEADING } from '../../selectors.ts';

/**
 * Finds the first heading owned by a container.
 * Nested containers own their own headings; `header` is transparent.
 */
export function getContainerHeading(el: Element): Element | undefined {
    for (const h of Array.from(el.querySelectorAll(SELECTOR_HEADING))) {
        let current = h.parentElement;
        let belongsToContainer = true;

        while (current && current !== el) {
            const role = getContainerRole(current);
            if (role && role !== 'header') {
                belongsToContainer = false;
                break;
            }
            current = current.parentElement;
        }

        if (!belongsToContainer || current !== el) continue;

        return h;
    }
    return undefined;
}
