import type { PageBasics } from '../../types/index.ts';
import { normalizeText } from '../../utils/index.ts';

/**
 * Collect basic page metadata from the current document
 *
 * @returns Page URL, title, description, and language.
 */
export function extractPageBasics(win: Window, doc: Document): PageBasics {
    return {
        url: win.location.href,
        title: normalizeText(doc.title),
        description: normalizeText(
            (doc.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content ?? '',
        ),
        language: normalizeText(doc.documentElement.lang) ?? 'en',
        viewport: {
            width: win.innerWidth,
            height: win.innerHeight,
            scrollY: win.scrollY,
            scrollHeight: doc.documentElement.scrollHeight,
        },
    };
}
