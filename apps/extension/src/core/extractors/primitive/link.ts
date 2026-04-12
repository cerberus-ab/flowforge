import type { InteractiveLink, InteractiveLinkType } from '@flowforge/shared';

function getElementLinkType(href: string): InteractiveLinkType {
    if (!href || href.trim() === '') return 'unknown';

    const normalized = href.trim().toLowerCase();

    // anchor
    if (normalized.startsWith('#')) return 'anchor';

    // protocols
    if (normalized.startsWith('mailto:')) return 'mailto';
    if (normalized.startsWith('tel:')) return 'tel';
    if (normalized.startsWith('javascript:')) return 'unknown';
    try {
        const current = new URL(window.location.href);
        const url = new URL(href, current);

        return url.origin === current.origin ? 'internal' : 'external';
    } catch {
        return 'unknown';
    }
}

/**
 * Extracts the link information from a given element.
 *
 * @param el - The DOM element to extract the link from.
 * @returns An {@link InteractiveLink} object containing the href and its resolved type,
 * or `undefined` if no href is found.
 */
export function getElementLink(el: Element): InteractiveLink | undefined {
    let href = el instanceof HTMLAnchorElement ? el.href : el.getAttribute('href');
    if (!href) return undefined;

    return {
        type: getElementLinkType(href),
        href,
    };
}
