import type {
    ContainerElementRole,
    ContentElementType,
    ElementContext,
    ElementLabel,
    InteractiveElementRole,
    InteractiveElementState,
} from '@flowforge/shared';

/**
 * Returns a normalized importance score [0..1]
 *
 */
function normalizeImportanceScore(score: number, min: number, max: number): number {
    if (score <= min) return 0;
    if (score >= max) return 1;
    return (score - min) / (max - min);
}

/**
 * Reads a container role path and derives boolean context flags used for scoring.
 *
 * @param path Ordered list of container roles from the current element context.
 * @returns Context flags indicating whether the element is inside main content, dialog, footer, or navigation regions.
 */
function readContextPath(path: ContainerElementRole[]) {
    const roles = new Set(path);
    return {
        inMain: roles.has('main content'),
        inDialog: (['dialog', 'modal dialog', 'alert dialog'] as const).some((r) => roles.has(r)),
        inFooter: roles.has('footer'),
        inNav: (['navigation', 'menu', 'toolbar'] as const).some((r) => roles.has(r)),
    };
}

/**
 * Computes a relevance importance score for a content element based on its type, text length, and container context
 *
 * Score range: [-5, 6]
 *
 * Typical interpretation:
 *  - 4–6 → high importance
 *  - 2–3 → moderate importance
 *  - ≤1 → low importance (can often be filtered out)
 *
 * @returns Normalized importance score [0..1]
 */
export function scoreContentElement(text: string, type: ContentElementType, context: ElementContext): number {
    let score = 0;
    // headings are more important than regular text
    if (type === 'heading') score += 2;
    // optimal text length
    if (type === 'text' && text.length > 50 && text.length < 300) score += 2;

    const { inMain, inDialog, inFooter, inNav } = readContextPath(context.path);
    // the main content is the primary source of meaningful information
    if (inMain) score += 2;
    // dialogs may contain important contextual info (e.g. onboarding, help)
    if (inDialog) score += 1;
    // navigation is usually UI structure, not actual content
    if (inNav) score -= 2;
    // footer is typically boilerplate (legal, links, etc.)
    if (inFooter) score -= 3;

    // section name → indicates structured content (belongs to a meaningful section)
    if (context.sectionName) score += 1;

    return normalizeImportanceScore(score, -5, 6);
}

/**
 * Computes a lightweight importance score for an interactive element
 *
 * The score estimates how likely the element is to be a meaningful user action target,
 * based on its role, visibility, textual clarity, and UI context.
 *
 * Score range: [-5, 10]
 *
 * Typical interpretation:
 * - 7–10 → strong action targets
 * - 4–6 → moderate relevance
 * - ≤3 → weak or noisy elements
 *
 * @returns Normalized importance score [0..1]
 */
export function scoreInteractiveElement(
    role: InteractiveElementRole,
    labels: ElementLabel[],
    text: string | undefined,
    state: InteractiveElementState,
    context: ElementContext,
): number {
    let score = 0;

    // labels and text → an element is understandable to the user
    if (labels.length > 0 || text) score += 2;

    // role importance → likelihood of being a user action target
    // primary actions (submit, login, etc.)
    if (role === 'button') score += 3;
    // start of user flows (input/search)
    if (role === 'textbox' || role === 'searchbox') score += 3;
    // selection step in flows
    if (role === 'combobox' || role === 'listbox') score += 2;
    // navigation or secondary actions
    if (role === 'link') score += 1;

    // hidden/disabled → not usable by the user
    if (state.hidden || state.disabled) return -5;

    const { inMain, inDialog, inFooter, inNav } = readContextPath(context.path);
    // main interaction area
    if (inMain) score += 2;
    // dialogs often contain focused actions
    if (inDialog) score += 1;
    // navigation can be valid action targets (routing)
    if (inNav) score += 1;
    // footer actions are rarely relevant
    if (inFooter) score -= 1;

    // section name → indicates structured content (belongs to a meaningful section)
    if (context.sectionName) score += 1;

    return normalizeImportanceScore(score, -5, 10);
}
