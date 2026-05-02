import type { InteractiveElement } from '#self/types';
import { getMaxImportanceScore, getMinImportanceScore, normalizeImportanceScore, readContextPath } from './utils.ts';

/**
 * Typical interpretation:
 *  - 7–10 → strong action targets
 *  - 4–6 → moderate relevance
 *  - ≤3 → weak or noisy elements
 *
 */
const interactiveScoringWeights = {
    // labels and text → an element is understandable to the user
    HAS_LABEL: 2,
    // base navigation actions
    ROLE_BASE: 1,
    // part of user flow (input, selection)
    ROLE_USER_FLOW: 1,
    // primary actions (submit, login)
    ROLE_CRITICAL: 1,
    // hidden/disabled → not usable by the user
    NOT_USABLE: -5,
    // size → very small targets are often weak action targets
    SIZE_TOO_SMALL: -1,
    // main interaction area
    IN_MAIN: 2,
    // dialogs often contain focused actions
    IN_DIALOG: 1,
    // navigation can be valid action targets (routing)
    IN_NAV: 1,
    // footer actions are rarely relevant
    IN_FOOTER: -1,
    // section name → indicates structured content (belongs to a meaningful section)
    HAS_NAMED_SECTION: 1,
} as const satisfies Record<string, number>;

const MIN_INTERACTIVE_SCORE = getMinImportanceScore(interactiveScoringWeights);
const MAX_INTERACTIVE_SCORE = getMaxImportanceScore(interactiveScoringWeights);

/**
 * Computes a lightweight importance score for an interactive element
 *
 * The score estimates how likely the element is to be a meaningful user action target,
 * based on its role, visibility, textual clarity, and UI context.
 *
 * @returns Normalized importance score [0..1]
 */
export function scoreInteractiveElement(element: InteractiveElement): number {
    let score = 0;
    const { role, labels, text, state, context, bbox } = element;

    if (labels.length > 0 || text) score += interactiveScoringWeights.HAS_LABEL;

    // by role
    if (role === 'link') {
        score += interactiveScoringWeights.ROLE_BASE;
    }
    if (role === 'combobox' || role === 'listbox') {
        score += (interactiveScoringWeights.ROLE_BASE + interactiveScoringWeights.ROLE_USER_FLOW);
    }
    if (role === 'button' || role === 'textbox' || role === 'searchbox') {
        score += (interactiveScoringWeights.ROLE_BASE + interactiveScoringWeights.ROLE_USER_FLOW + interactiveScoringWeights.ROLE_CRITICAL);
    }
    // by view
    if (state.hidden || state.disabled) score += interactiveScoringWeights.NOT_USABLE;
    if (bbox.width * bbox.height < 24 * 24) score += interactiveScoringWeights.SIZE_TOO_SMALL;
    // by context
    const { inMain, inDialog, inFooter, inNav } = readContextPath(context.path);
    if (inMain) score += interactiveScoringWeights.IN_MAIN;
    if (inDialog) score += interactiveScoringWeights.IN_DIALOG;
    if (inNav) score += interactiveScoringWeights.IN_NAV;
    if (inFooter) score += interactiveScoringWeights.IN_FOOTER;
    if (context.sectionName) score += interactiveScoringWeights.HAS_NAMED_SECTION;

    return normalizeImportanceScore(score, MIN_INTERACTIVE_SCORE, MAX_INTERACTIVE_SCORE);
}
