import type { ContentElement } from '#self/types';
import { getMaxImportanceScore, getMinImportanceScore, normalizeImportanceScore, readContextPath } from './utils.ts';

/**
 * Typical interpretation:
 *   - 5–8 → high importance
 *   - 2–4 → moderate importance
 *   - ≤1 → low importance (can often be filtered out)
 *
 */
const contentScoringWeights = {
    // headings are more important than regular text
    HEADING: 2,
    // minimum length for meaningful content
    TEXT_LEN_MEAN: 1,
    // optimal paragraph size (most informative)
    TEXT_LEN_OPTIMAL: 1,
    // too long → likely noisy or overly verbose
    TEXT_LEN_TOO_LONG: -1,
    // the main content is the primary source of meaningful information
    IN_MAIN: 2,
    // dialogs may contain important contextual info (e.g. onboarding, help)
    IN_DIALOG: 1,
    // navigation is usually UI structure, not actual content
    IN_NAV: -2,
    // footer is typically boilerplate (legal, links, etc.)
    IN_FOOTER: -3,
    // section name → indicates structured content (belongs to a meaningful section)
    HAS_NAMED_SECTION: 1,
} as const satisfies Record<string, number>;

const MIN_CONTENT_SCORE = getMinImportanceScore(contentScoringWeights);
const MAX_CONTENT_SCORE = getMaxImportanceScore(contentScoringWeights);

/**
 * Computes a relevance importance score for a content element based on its type, text length, and container context
 *
 * @returns Normalized importance score [0..1]
 */
export function scoreContentElement(element: ContentElement): number {
    let score = 0;
    const { type, text, context } = element;

    // by type
    if (type === 'heading') score += contentScoringWeights.HEADING;
    // by text length
    if (text.length > 60) score += contentScoringWeights.TEXT_LEN_MEAN;
    if (text.length > 100 && text.length < 300) score += contentScoringWeights.TEXT_LEN_OPTIMAL;
    if (text.length > 600) score += contentScoringWeights.TEXT_LEN_TOO_LONG;
    // by context
    const { inMain, inDialog, inFooter, inNav } = readContextPath(context.path);
    if (inMain) score += contentScoringWeights.IN_MAIN;
    if (inDialog) score += contentScoringWeights.IN_DIALOG;
    if (inNav) score += contentScoringWeights.IN_NAV;
    if (inFooter) score += contentScoringWeights.IN_FOOTER;
    if (context.sectionName) score += contentScoringWeights.HAS_NAMED_SECTION;

    return normalizeImportanceScore(score, MIN_CONTENT_SCORE, MAX_CONTENT_SCORE);
}
