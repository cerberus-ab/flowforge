import type { DocumentRetriever, RetrievedDocument, RetrieveOptions } from '#self/types';
import { PageIndexer } from './PageIndexer.ts';
import type { PageData } from '@flowforge/shared';

export class PageContextProvider implements DocumentRetriever {
    readonly pageData: PageData;
    private readonly indexer: PageIndexer;

    constructor(pageData: PageData, indexer: PageIndexer) {
        this.pageData = pageData;
        this.indexer = indexer;
    }

    async retrieve(query: string, params: RetrieveOptions = { k: 5 }): Promise<RetrievedDocument[]> {
        return this.indexer.searchForPage(this.pageData, query, params);
    }
}
