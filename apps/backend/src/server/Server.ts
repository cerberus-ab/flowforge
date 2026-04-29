import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import boxen from 'boxen';

import type { LlmProvider } from '#self/types';
import { PageIndexer } from '#self/indexer';
import { LlmProviderFactory, WebNavigationAgent } from '#self/agent';
import type { AppConfig } from '#self/config';
import { Analytics } from '#self/analytics';

import { createHealthHandler } from './routes/health.ts';
import { createQueryHandler } from './routes/query.ts';
import { createSearchHandler } from './routes/search.ts';
import { createAnalyticsHandler } from './routes/analytics.ts';

const settings = {
    REQ_JSON_BODY_LIMIT: '50mb',
} as const;

export class Server {
    private readonly config: AppConfig;
    private readonly llmProvider: LlmProvider;
    private readonly indexer: PageIndexer;
    private readonly agent: WebNavigationAgent;
    private readonly analytics: Analytics;
    private readonly app: Express;

    constructor(config: AppConfig) {
        this.config = config;

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

        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json({ limit: settings.REQ_JSON_BODY_LIMIT }));
    }

    private setupRoutes(): void {
        this.app.get('/health', createHealthHandler());
        this.app.post(
            '/query',
            createQueryHandler({
                indexer: this.indexer,
                agent: this.agent,
                analytics: this.analytics,
            }),
        );
        this.app.post(
            '/search',
            createSearchHandler({
                indexer: this.indexer,
            }),
        );
        this.app.get(
            '/analytics',
            createAnalyticsHandler({
                analytics: this.analytics,
            }),
        );
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
        this.setupGracefulShutdown();
    }
}
