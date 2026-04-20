import type { IndexableDocument, DocumentTransformer } from '#self/types';
import { ContentElementsTransformer } from './ContentElementsTransformer.ts';
import { InteractiveElementsTransformer } from './InteractiveElementsTransformer.ts';
import { AbstractDocumentTransformer } from './AbstractDocumentTransformer.ts';
import type { PageModel } from '@flowforge/shared';

export class CompositeDocumentTransformer implements DocumentTransformer {
    private readonly transformers: AbstractDocumentTransformer[];
    private readonly verbose: boolean;

    constructor(params: { chunkSize: number; chunkOverlapRatio: number; verbose: boolean }) {
        this.transformers = [
            new ContentElementsTransformer({ chunkSize: params.chunkSize, chunkOverlapRatio: params.chunkOverlapRatio }),
            new InteractiveElementsTransformer(),
        ];
        this.verbose = params.verbose;
    }

    list(): string[] {
        return this.transformers.map((t) => t.name);
    }

    async transform(pageModel: PageModel): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];
        for (const t of this.transformers) {
            const transformed = await t.transform(pageModel);
            if (this.verbose) {
                console.log(
                    `[Indexer] Transformed ${transformed.length} documents via ${t.name} for ${pageModel.basics.url}`,
                    transformed.map((doc) => doc.content),
                );
            }
            docs.push(...transformed);
        }
        return docs;
    }
}
