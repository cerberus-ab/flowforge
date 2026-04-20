import { AbstractDocumentTransformer } from './AbstractDocumentTransformer.ts';
import type { IndexableDocument } from '#self/types';
import type { PageModel } from '@flowforge/shared';
import { formatInteractiveElement } from '#self/indexer';

export class InteractiveElementsTransformer extends AbstractDocumentTransformer {
    constructor() {
        super('interactive_elements');
    }

    override async transformFn(pageModel: PageModel): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];
        for (const el of pageModel.interactive) {
            const content = formatInteractiveElement(el);
            docs.push(this.createDocument(content, 'interactive', el));
        }
        return docs;
    }
}
