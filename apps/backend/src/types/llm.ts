import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { LlmProviderType } from '#self/config';

export interface ChatModelParams {
    temperature: number;
    maxTokens: number;
}

export interface LlmProviderInfo {
    provider: LlmProviderType;
    model: string;
    embedding: string;
    details?: string;
}

export interface EmbeddingProvider {
    name(): string;
    embed(texts: string[]): Promise<number[][]>;
    embedQuery(query: string): Promise<number[]>;
}

export interface LlmProvider {
    createChatModel(params: ChatModelParams): BaseChatModel;
    createEmbeddingProvider(): EmbeddingProvider;
    health(): Promise<boolean>;
    info(): LlmProviderInfo;
}
