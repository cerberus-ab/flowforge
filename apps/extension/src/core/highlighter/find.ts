import { constants } from '#self/constants';

/**
 * Finds a DOM element using a prioritized lookup strategy
 */
export function findElement(dataId: string, selector: string): Element | null {
    let el: Element | null = null;
    try {
        if (dataId) {
            el = document.querySelector(`[${constants.DATA_ID_ATTRIBUTE}="${dataId}"]`);
        }
        if (!el && selector) {
            el = document.querySelector(selector);
        }
        return el;
    } finally {
        if (!el) {
            console.warn('[FlowForge] Element not found:', { dataId, selector });
        }
    }
}
