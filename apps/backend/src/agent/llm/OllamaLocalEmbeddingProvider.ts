import type { EmbeddingProvider } from '#self/types';

export class OllamaLocalEmbeddingProvider implements EmbeddingProvider {
    private readonly baseUrl: string;
    private readonly model: string;

    constructor(baseUrl: string, model: string) {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async embed(texts: string[]): Promise<number[][]> {
        return this.generate(texts);
    }

    async embedQuery(query: string): Promise<number[]> {
        return (await this.generate([query]))[0]!;
    }

    name(): string {
        return `ollama:${this.model}`;
    }

    private async generate(texts: string[]): Promise<number[][]> {
        const res = await fetch(`${this.baseUrl}/api/embed`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                input: texts,
                truncate: true,
                keep_alive: '5m',
            }),
        });
        const json = await res.json();

        return json.embeddings;
    }
}
