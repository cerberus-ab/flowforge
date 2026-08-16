import type { IndexableDocument, DocumentTransformer } from '@/types';
import { randomUUID } from 'crypto';
import type { BaseElement, PageTrail } from '@flowforge/page-trail';

export abstract class AbstractDocumentTransformer implements DocumentTransformer {
    readonly name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    protected abstract transformFn(pageTrail: PageTrail): Promise<IndexableDocument[]>;

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

    async transform(pageTrail: PageTrail): Promise<IndexableDocument[]> {
        try {
            return await this.transformFn(pageTrail);
        } catch (error) {
            console.error(`[Indexer] Error transforming via ${this.name} for ${pageTrail.basics.url}:`, error);
            return [];
        }
    }
}
