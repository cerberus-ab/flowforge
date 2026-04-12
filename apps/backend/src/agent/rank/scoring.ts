import type { RetrievedDocument } from '#self/types';

/**
 * Computes the final score for an element lookup document
 *
 * Prioritizes semantic similarity, with a small boost from element importance.
 * Used when selecting the best matching UI element.
 */
export function scoreForLookup(document: RetrievedDocument): number {
    return 0.8 * document.semanticScore + 0.2 * document.metadata.element.importanceScore;
}

/**
 * Computes the final score for a content retrieval document
 *
 * Strongly prioritizes semantic relevance, with minimal importance prior.
 * Used for selecting text blocks that best answer the user query.
 */
export function scoreForAnswer(document: RetrievedDocument): number {
    return 0.85 * document.semanticScore + 0.15 * document.metadata.element.importanceScore;
}

/**
 * Computes the final score for an interactive workflow document
 *
 * Balances semantic relevance with element importance, since good workflows
 * require both relevant and actionable UI elements.
 */
export function scoreForAction(document: RetrievedDocument): number {
    return 0.7 * document.semanticScore + 0.3 * document.metadata.element.importanceScore;
}
