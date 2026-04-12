import type { IndexableDocument, DocumentExtractor } from '#self/types';
import { TextContentExtractor } from './TextContentExtractor.ts';
import { InteractiveElementExtractor } from './InteractiveElementExtractor.ts';
import { AbstractDocumentExtractor } from './AbstractDocumentExtractor.ts';
import type { PageData } from '@flowforge/shared';

export class CompositeDocumentExtractor implements DocumentExtractor {
    private readonly extractors: AbstractDocumentExtractor[];
    private readonly verbose: boolean;

    constructor(params: { chunkSize: number; chunkOverlapRatio: number; verbose: boolean }) {
        this.extractors = [
            new TextContentExtractor({ chunkSize: params.chunkSize, chunkOverlapRatio: params.chunkOverlapRatio }),
            new InteractiveElementExtractor(),
        ];
        this.verbose = params.verbose;
    }

    list(): string[] {
        return this.extractors.map((extractor) => extractor.name);
    }

    async extract(pageData: PageData): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];
        for (const extractor of this.extractors) {
            const extracted = await extractor.extract(pageData);
            if (this.verbose) {
                console.log(
                    `[Indexer] Extracted ${extracted.length} documents via ${extractor.name} for ${pageData.basics.url}`,
                    extracted.map((doc) => doc.content),
                );
            }
            docs.push(...extracted);
        }
        return docs;
    }
}
