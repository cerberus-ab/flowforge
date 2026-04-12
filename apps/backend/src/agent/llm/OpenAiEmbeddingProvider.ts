import type { EmbeddingProvider } from '#self/types';
import { OpenAIEmbeddings } from '@langchain/openai';

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
    private readonly client: OpenAIEmbeddings;

    constructor(client: OpenAIEmbeddings) {
        this.client = client;
    }

    async embed(texts: string[]): Promise<number[][]> {
        return this.client.embedDocuments(texts);
    }

    async embedQuery(query: string): Promise<number[]> {
        return this.client.embedQuery(query);
    }

    name(): string {
        return `openai:${this.client.model}`;
    }
}
