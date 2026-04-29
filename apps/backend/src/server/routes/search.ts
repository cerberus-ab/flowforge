import type { Request, Response } from 'express';
import type { ErrorResponse, RetrievedDocument, SearchRequest, SearchResponse } from '#self/types';
import { PageIndexer } from '#self/indexer';

interface SearchHandlerDeps {
    indexer: PageIndexer;
}

export function createSearchHandler({ indexer }: SearchHandlerDeps) {
    return async function handleSearch(
        req: Request<{}, SearchResponse<RetrievedDocument>, SearchRequest>,
        res: Response<SearchResponse<RetrievedDocument> | ErrorResponse>,
    ): Promise<void> {
        try {
            const { pageUrl, query, k = 5 } = req.body;

            if (!pageUrl || !query) {
                res.status(400).json({
                    error: 'Missing required fields: pageUrl, query',
                });
                return;
            }
            console.log(`[Server] Search: ${pageUrl} / ${query}`);

            const results = await indexer.searchForUrl(pageUrl, query, { k });
            res.json({ results });
        } catch (error) {
            console.error('[Server] Error:', error);
            res.status(500).json({
                error: 'Search failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
