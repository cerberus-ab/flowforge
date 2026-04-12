import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOllama } from '@langchain/ollama';
import type { ChatModelParams, EmbeddingProvider, LlmProvider, LlmProviderInfo } from '#self/types';
import { OllamaLocalEmbeddingProvider } from './OllamaLocalEmbeddingProvider.ts';

export class OllamaLocalLlmProvider implements LlmProvider {
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly embedding: string;

    constructor(baseUrl: string, model: string, embedding: string) {
        this.baseUrl = baseUrl;
        this.model = model;
        this.embedding = embedding;
    }

    createChatModel(params: ChatModelParams): BaseChatModel {
        return new ChatOllama({
            baseUrl: this.baseUrl,
            model: this.model,
            temperature: params.temperature,
            numPredict: params.maxTokens,
        });
    }

    createEmbeddingProvider(): EmbeddingProvider {
        return new OllamaLocalEmbeddingProvider(this.baseUrl, this.embedding);
    }

    /**
     * Checks whether the local Ollama server is reachable and the configured model exists.
     */
    async health(): Promise<boolean> {
        const res = await fetch(`${this.baseUrl}/api/tags`);
        if (!res.ok) {
            throw new Error('[LLM] Ollama Local is not serving');
        }
        const data = await res.json();
        if (!data.models?.some((m: any) => m.name === this.model)) {
            throw new Error(`[LLM] Model ${this.model} not found in Ollama Local`);
        }
        return true;
    }

    info(): LlmProviderInfo {
        return { provider: 'ollama-local', model: this.model, embedding: this.embedding, details: this.baseUrl };
    }
}
