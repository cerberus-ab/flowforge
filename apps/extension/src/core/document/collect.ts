import { PageTrail, PageTrailCollector } from '@flowforge/page-trail';
import { constants } from '@/constants';
import { findDataIds, getOrCreateDataId } from './locate';

const pageTrailCollectorDefaults = {
    contentElementsLimit: constants.CONTENT_ELEMENTS_LIMIT,
    interactiveElementsLimit: constants.INTERACTIVE_ELEMENTS_LIMIT,
};

/**
 * Checks whether all referenced elements are present in the document.
 *
 * @param doc - The document to search for data id attributes.
 * @param dataIds - The data ids to find.
 * @returns Whether every data id is present.
 */
export function containsElements(doc: Document, dataIds: string[]): boolean {
    const presentIds = new Set(findDataIds(doc));
    return dataIds.every((id) => presentIds.has(id));
}

/**
 * Collects a page trail with DOM locators, assigning data ids where needed.
 *
 * @param win - The window containing the page.
 * @param doc - The document to collect.
 * @returns The locator-enabled page trail.
 */
export function collectPageTrail(win: Window, doc: Document): PageTrail {
    return PageTrailCollector.collectFor(win, doc, {
        ...pageTrailCollectorDefaults,
        getElementDataId: getOrCreateDataId,
    });
}

/**
 * Collects page context without DOM locators or assigning data ids.
 *
 * @param win - The window containing the page.
 * @param doc - The document to collect.
 * @returns The context-only page trail.
 */
export function collectPageTrailContextOnly(win: Window, doc: Document): PageTrail {
    return PageTrailCollector.collectFor(win, doc, {
        ...pageTrailCollectorDefaults,
        contextOnly: true,
    });
}
