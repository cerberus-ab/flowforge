import { AbstractDocumentTransformer } from './AbstractDocumentTransformer.ts';
import type { IndexableDocument } from '@/types';
import { type PageTrail, semInteractiveElement } from '@flowforge/page-trail';

export class InteractiveElementsTransformer extends AbstractDocumentTransformer {
    constructor() {
        super('interactive_elements');
    }

    override async transformFn(pageTrail: PageTrail): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];
        for (const el of pageTrail.interactive) {
            const content = semInteractiveElement(el).text();
            docs.push(this.createDocument(content, el));
        }
        return docs;
    }
}
