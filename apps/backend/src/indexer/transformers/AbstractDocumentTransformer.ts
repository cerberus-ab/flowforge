import type { IndexableDocument, DocumentTransformer, DocumentMetadata, DocumentType } from '#self/types';
import { randomUUID } from 'crypto';
import type { BaseElement, PageModel } from '@flowforge/page-model';

export abstract class AbstractDocumentTransformer implements DocumentTransformer {
    readonly name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    protected abstract transformFn(pageModel: PageModel): Promise<IndexableDocument[]>;

    private createDocumentId() {
        return randomUUID();
    }

    protected createDocument(content: string, el: BaseElement): IndexableDocument {
        return {
            id: this.createDocumentId(),
            content,
            metadata: {
                type: el.kind,
                element: el,
            },
        };
    }

    async transform(pageModel: PageModel): Promise<IndexableDocument[]> {
        try {
            return await this.transformFn(pageModel);
        } catch (error) {
            console.error(`[Indexer] Error transforming via ${this.name} for ${pageModel.basics.url}:`, error);
            return [];
        }
    }
}
