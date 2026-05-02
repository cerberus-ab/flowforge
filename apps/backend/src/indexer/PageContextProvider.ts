import type { DocumentRetriever, RetrievedDocument, RetrieveOptions } from '#self/types';
import { PageIndexer } from './PageIndexer.ts';
import type { PageModel } from '@flowforge/page-model';

export class PageContextProvider implements DocumentRetriever {
    readonly pageModel: PageModel;
    private readonly indexer: PageIndexer;

    constructor(pageModel: PageModel, indexer: PageIndexer) {
        this.pageModel = pageModel;
        this.indexer = indexer;
    }

    async retrieve(query: string, params: RetrieveOptions = { k: 5 }): Promise<RetrievedDocument[]> {
        return this.indexer.searchForPage(this.pageModel, query, params);
    }
}
