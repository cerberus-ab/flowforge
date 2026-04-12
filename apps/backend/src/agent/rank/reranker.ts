import type { RetrievedDocument } from '#self/types';

export interface ScoredRetrievedDocument {
    document: RetrievedDocument;
    score: number;
}

/**
 * Reranks retrieved documents by score in descending order and limits the result size
 *
 * @param documents The documents to score and rerank.
 * @param scoreFn A scoring function applied to each document.
 * @param limit Maximum number of items to return. Returns all items when `limit <= 0`.
 * @returns A sorted array of scored documents.
 */
export function rerankRetrievedDocuments(
    documents: RetrievedDocument[],
    scoreFn: (document: RetrievedDocument) => number,
    limit: number,
): ScoredRetrievedDocument[] {
    const reranked = documents
        .map((document) => ({
            document,
            score: scoreFn(document),
        }))
        .sort((a, b) => b.score - a.score);

    return limit > 0 ? reranked.slice(0, limit) : reranked;
}
