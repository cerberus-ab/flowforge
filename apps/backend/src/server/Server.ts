import express from 'express';
import type { Express, Request, Response } from 'express';
import cors from 'cors';
import boxen from 'boxen';

import type {
    AnalyticsResponse,
    ErrorResponse,
    HealthResponse,
    LlmProvider, LlmProviderInfo,
    QueryRequest,
    QueryResponse,
    RetrievedDocument,
    SearchRequest,
    SearchResponse,
} from '#self/types';
import { PageIndexer, PageContextProvider } from '#self/indexer';
import { LlmProviderFactory, WebNavigationAgent } from '#self/agent';
import type { AppConfig } from '#self/config';
import { Analytics } from '#self/analytics';

const REQ_JSON_BODY_LIMIT = '50mb';

export class Server {
    private readonly config: AppConfig;
    private readonly app: Express;
    private readonly llmProvider: LlmProvider;
    private readonly indexer: PageIndexer;
    private readonly agent: WebNavigationAgent;
    private readonly analytics: Analytics;

    constructor(config: AppConfig) {
        this.config = config;
        this.app = express();

        // Init LLM provider
        this.llmProvider = LlmProviderFactory.create(config);
        // Init Indexer service
        const embeddingProvider = this.llmProvider.createEmbeddingProvider();
        this.indexer = new PageIndexer({
            embeddingProvider,
            chunkSize: config.indexer.chunkSize,
            chunkOverlapRatio: config.indexer.chunkOverlapRatio,
            verbose: config.logLevel === 'debug',
        });
        // Init Agent service
        const chatModel = this.llmProvider.createChatModel({
            temperature: config.agent.temperature,
            maxTokens: config.agent.maxTokens,
        });
        this.agent = new WebNavigationAgent({
            llmProviderInfo: this.llmProvider.info(),
            chatModel,
            toolCallLimit: config.agent.toolCallLimit,
            recursionLimit: config.agent.recursionLimit,
            verbose: config.logLevel === 'debug',
        });
        // Init Analytics service
        this.analytics = new Analytics();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupGracefulShutdown();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json({ limit: REQ_JSON_BODY_LIMIT }));
    }

    private setupRoutes(): void {
        this.app.get('/health', this.handleHealth.bind(this));
        this.app.post('/query', this.handleQuery.bind(this));
        this.app.post('/search', this.handleSearch.bind(this));
        this.app.get('/analytics', this.handleAnalytics.bind(this));
    }

    private handleHealth(_req: Request, res: Response<HealthResponse>): void {
        res.json({
            status: 'ok',
            service: 'FlowForge Backend',
            timestamp: new Date().toISOString(),
        });
    }

    private async handleQuery(
        req: Request<{}, QueryResponse | ErrorResponse, QueryRequest>,
        res: Response<QueryResponse | ErrorResponse>,
    ): Promise<void> {
        try {
            const { question, pageData, domain } = req.body;

            if (!question || !pageData) {
                res.status(400).json({
                    error: 'Missing required fields: question, pageData',
                });
                return;
            }
            console.log(`[Server] Query: ${domain} / ${question}`);

            await this.indexer.indexPage(pageData);
            const pageContext = new PageContextProvider(pageData, this.indexer);
            const agentResponse = await this.agent.processQuery(question, pageContext);

            this.analytics.track(domain, pageData.basics.url, {
                question,
                timestamp: Date.now(),
                agentToolCalls: agentResponse.execResult.toolCallsList.map((call) => call.name) || [],
            });
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
    }

    private async handleSearch(
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

            const results = await this.indexer.searchForUrl(pageUrl, query, { k });
            res.json({ results });
        } catch (error) {
            console.error('[Server] Error:', error);
            res.status(500).json({
                error: 'Search failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    private async handleAnalytics(_req: Request, res: Response<AnalyticsResponse>): Promise<void> {
        res.json({
            data: Object.fromEntries(
                Array.from(this.analytics.getAll()).map(([domain, pages]) => [domain, Object.fromEntries(pages)]),
            ),
            timestamp: new Date().toISOString(),
        });
    }

    private setupGracefulShutdown(): void {
        const shutdown = (signal: string) => {
            console.log(`[Server] Shutdown: Received ${signal}, shutting down gracefully...`);
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    private printStartupBanner(): void {
        const LlmProviderInfo = this.llmProvider.info();
        console.log(
            boxen(
                [
                    `FlowForge – Backend ${this.config.pkg.version}`,
                    ' ─── ',
                    `Server: running on port ${this.config.port}`,
                    `LLM Provider: ${LlmProviderInfo.provider}`,
                    `- Model: ${LlmProviderInfo.model}`,
                    `- Embedding: ${LlmProviderInfo.embedding}`,
                    LlmProviderInfo.details ? `- Details: ${LlmProviderInfo.details}` : '',
                ]
                    .filter(Boolean)
                    .join('\n'),
                {
                    padding: 1,
                    borderStyle: 'round',
                },
            ),
        );
        console.log('[Server] Waiting for questions...');
    }

    async start(): Promise<void> {
        await this.llmProvider.health();
        await this.indexer.health();

        this.app.listen(this.config.port, () => {
            this.printStartupBanner();
        });
    }
}
