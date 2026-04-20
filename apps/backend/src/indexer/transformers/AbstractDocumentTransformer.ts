import type { IndexableDocument, DocumentTransformer, DocumentMetadata, DocumentType } from '#self/types';
import { randomUUID } from 'crypto';
import type { BaseElement, PageModel } from '@flowforge/shared';

export abstract class AbstractDocumentTransformer implements DocumentTransformer {
    readonly name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    protected abstract transformFn(pageModel: PageModel): Promise<IndexableDocument[]>;

    private createDocumentId() {
        return randomUUID();
    }

    private createMetadata(type: DocumentType, el: BaseElement): DocumentMetadata {
        return {
            type,
            element: el,
        };
    }

    protected createDocument(content: string, type: DocumentType, el: BaseElement): IndexableDocument {
        return {
            id: this.createDocumentId(),
            content,
            metadata: this.createMetadata(type, el),
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
