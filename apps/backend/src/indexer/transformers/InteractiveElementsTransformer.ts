import { AbstractDocumentTransformer } from './AbstractDocumentTransformer.ts';
import type { IndexableDocument } from '#self/types';
import { formatInteractiveElement, type PageTrail } from '@flowforge/page-trail';

export class InteractiveElementsTransformer extends AbstractDocumentTransformer {
    constructor() {
        super('interactive_elements');
    }

    override async transformFn(pageTrail: PageTrail): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];
        for (const el of pageTrail.interactive) {
            const content = formatInteractiveElement(el);
            docs.push(this.createDocument(content, el));
        }
        return docs;
    }
}
