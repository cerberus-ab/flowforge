import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import type { ChatModelParams, EmbeddingProvider, LlmProvider, LlmProviderInfo } from '#self/types';
import { OpenAiEmbeddingProvider } from './OpenAiEmbeddingProvider.ts';

export class OpenAiLlmProvider implements LlmProvider {
    private readonly apiKey: string;
    private readonly model: string;
    private readonly embedding: string;

    constructor(apiKey: string, model: string, embedding: string) {
        this.apiKey = apiKey;
        this.model = model;
        this.embedding = embedding;
    }

    createChatModel(params: ChatModelParams): BaseChatModel {
        return new ChatOpenAI({
            apiKey: this.apiKey,
            model: this.model,
            temperature: params.temperature,
            maxCompletionTokens: params.maxTokens,
        });
    }

    createEmbeddingProvider(): EmbeddingProvider {
        return new OpenAiEmbeddingProvider(
            new OpenAIEmbeddings({
                apiKey: this.apiKey,
                model: this.embedding,
            }),
        );
    }

    /**
     * Verifies OpenAI connectivity by running a minimal completion request.
     */
    async health(): Promise<boolean> {
        const model = this.createChatModel({ temperature: 0, maxTokens: 1 });
        await model.invoke([{ role: 'user', content: 'ping' }]);
        return true;
    }

    info(): LlmProviderInfo {
        return {
            provider: 'openai',
            model: this.model,
            embedding: this.embedding,
        };
    }
}
