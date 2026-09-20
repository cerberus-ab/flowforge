import type { Request, Response } from 'express';
import type { QueryRequest, QueryResponse } from '@flowforge/contract';
import type { ErrorResponse } from '@/types';
import { PageContextProvider, PageIndexer } from '@/indexer';
import { WebNavigationAgent } from '@/agent';
import { Analytics } from '@/analytics';
import { PageTrail } from '@flowforge/page-trail';

interface QueryHandlerDeps {
    indexer: PageIndexer;
    agent: WebNavigationAgent;
    analytics: Analytics;
}

export function createQueryHandler({ indexer, agent, analytics }: QueryHandlerDeps) {
    return async function handleQuery(
        req: Request<Record<string, never>, QueryResponse | ErrorResponse, QueryRequest>,
        res: Response<QueryResponse | ErrorResponse>,
    ): Promise<void> {
        try {
            const { question, pageTrailDto, domain } = req.body;

            if (!question || !pageTrailDto) {
                res.status(400).json({
                    error: 'Missing required fields: question, pageTrailDto',
                });
                return;
            }
            let pageTrail: PageTrail;
            try {
                pageTrail = PageTrail.fromDto(pageTrailDto);
            } catch (error) {
                res.status(400).json({
                    error: 'Invalid pageTrailDto',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
                return;
            }
            if (pageTrail.contextOnly) {
                res.status(400).json({
                    error: 'Invalid pageTrailDto',
                    message: 'Query does not support a context-only PageTrail',
                });
                return;
            }
            console.log(`[Server] Query: ${domain} / ${question}`);

            await indexer.indexPage(pageTrail);
            const pageContext = new PageContextProvider(pageTrail, indexer);
            const agentResponse = await agent.processQuery(question, pageContext);
            analytics.trackQA(domain, pageTrail.basics.url, question, agentResponse);

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
