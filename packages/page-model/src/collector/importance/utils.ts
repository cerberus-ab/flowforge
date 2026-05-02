import type { ContainerElementRole } from '#self/types';

/**
 * Returns the minimum possible score by weights
 *
 */
export function getMinImportanceScore(weights: Record<string, number>): number {
    return Object.values(weights)
        .filter((v) => v < 0)
        .reduce((sum, v) => sum + v, 0);
}

/**
 * Returns the maximum possible score by weights
 *
 */
export function getMaxImportanceScore(weights: Record<string, number>): number {
    return Object.values(weights)
        .filter((v) => v > 0)
        .reduce((sum, v) => sum + v, 0);
}

/**
 * Returns a normalized importance score [0..1]
 *
 */
export function normalizeImportanceScore(score: number, min: number, max: number): number {
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
export function readContextPath(path: ContainerElementRole[]) {
    const roles = new Set(path);
    return {
        inMain: roles.has('main content'),
        inDialog: (['dialog', 'modal dialog', 'alert dialog'] as const).some((r) => roles.has(r)),
        inFooter: roles.has('footer'),
        inNav: (['navigation', 'menu', 'toolbar'] as const).some((r) => roles.has(r)),
    };
}
