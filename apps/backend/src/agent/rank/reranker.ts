import type { RerankedDocument, RetrievedDocument } from '#self/types';

/**
 * Reranks retrieved documents using a scoring function and returns them in descending score order.
 *
 * @param documents - The documents to rerank.
 * @param scoreFn - Function used to compute a numeric score for each document.
 * @param limit - Maximum number of documents to return. Use `0` to return all.
 * @returns The reranked documents, optionally truncated to the provided limit.
 */
export function rerankRetrievedDocuments(
    documents: RetrievedDocument[],
    scoreFn: (document: RetrievedDocument) => number,
    limit: number = 0,
): RerankedDocument[] {
    const reranked = documents
        .map((document) => ({
            ...document,
            score: scoreFn(document),
        }))
        .sort((a, b) => b.score - a.score);

    return limit > 0 ? reranked.slice(0, limit) : reranked;
}
