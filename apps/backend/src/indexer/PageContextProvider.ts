import type { DocumentRetriever, RetrievedDocument, RetrieveOptions } from '#self/types';
import { PageIndexer } from './PageIndexer.ts';
import type { PageTrail } from '@flowforge/page-trail';

export class PageContextProvider implements DocumentRetriever {
    readonly pageTrail: PageTrail;
    private readonly indexer: PageIndexer;

    constructor(pageTrail: PageTrail, indexer: PageIndexer) {
        this.pageTrail = pageTrail;
        this.indexer = indexer;
    }

    async retrieve(query: string, params: RetrieveOptions = { k: 5 }): Promise<RetrievedDocument[]> {
        return this.indexer.searchForPage(this.pageTrail, query, params);
    }
}
