import type { Request, Response } from 'express';
import type { QueryRequest, QueryResponse } from '@flowforge/shared/';
import type { ErrorResponse } from '#self/types';
import { PageContextProvider, PageIndexer } from '#self/indexer';
import { WebNavigationAgent } from '#self/agent';
import { Analytics } from '#self/analytics';

interface QueryHandlerDeps {
    indexer: PageIndexer;
    agent: WebNavigationAgent;
    analytics: Analytics;
}

export function createQueryHandler({ indexer, agent, analytics }: QueryHandlerDeps) {
    return async function handleQuery(
        req: Request<{}, QueryResponse | ErrorResponse, QueryRequest>,
        res: Response<QueryResponse | ErrorResponse>,
    ): Promise<void> {
        try {
            const { question, pageModel, domain } = req.body;

            if (!question || !pageModel) {
                res.status(400).json({
                    error: 'Missing required fields: question, pageModel',
                });
                return;
            }
            console.log(`[Server] Query: ${domain} / ${question}`);

            await indexer.indexPage(pageModel);
            const pageContext = new PageContextProvider(pageModel, indexer);
            const agentResponse = await agent.processQuery(question, pageContext);
            analytics.trackQA(domain, pageModel.basics.url, question, agentResponse);

            res.json({
                result: agentResponse.result,
                metadata: {
                    model: agentResponse.execResult.model,
                    usage: agentResponse.execResult.usageMetadata,
                    execTimeMs: agentResponse.execTimeMs,
                },
            });
        } catch (error) {
            console.error('[Server] Error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
}
