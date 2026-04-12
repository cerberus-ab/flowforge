import { createHash } from 'crypto';
import type {
    DocumentExtractor,
    DocumentVectorStorage,
    EmbeddingProvider,
    RetrievedDocument,
    RetrieveOptions,
} from '#self/types';
import { VectorStorageFactory } from './vector/VectorStorageFactory.ts';
import { CompositeDocumentExtractor } from './extractors/CompositeDocumentExtractor.ts';
import type { PageData } from '@flowforge/shared';

interface PageIndexerOptions {
    embeddingProvider: EmbeddingProvider;
    chunkSize?: number;
    chunkOverlapRatio?: number;
    verbose?: boolean;
}

export class PageIndexer {
    private readonly datasetPref: string;
    private readonly vectorStore: DocumentVectorStorage;
    private readonly extractor: DocumentExtractor;
    private readonly verbose: boolean;

    /**
     * Creates a new PageIndexer instance
     *
     * @param options - Configuration options for the indexer.
     * @param options.embeddingProvider - The embedding provider to use for vectorization.
     * @param options.chunkSize - Size of text chunks for document extraction. Default is 500.
     * @param options.chunkOverlapRatio - Overlap ratio between consecutive chunks. Default is 0.10.
     * @param options.verbose - Enable verbose logging. Default is false.
     */
    constructor(options: PageIndexerOptions) {
        const config = {
            chunkSize: 500,
            chunkOverlapRatio: 0.1,
            verbose: false,
            ...options,
        };
        this.datasetPref = config.embeddingProvider
            .name()
            .replace(/[^a-z0-9]+/g, '_')
            .toLowerCase();

        this.vectorStore = VectorStorageFactory.create(config.embeddingProvider);
        this.extractor = new CompositeDocumentExtractor({
            chunkSize: config.chunkSize,
            chunkOverlapRatio: config.chunkOverlapRatio,
            verbose: config.verbose,
        });
        this.verbose = config.verbose;
    }

    /**
     * Checks the health status of the vector storage backend.
     */
    async health(): Promise<boolean> {
        await this.vectorStore.health();
        return true;
    }

    /**
     * Extracts documents from a page and indexes them into the vector store
     *
     * @param pageData - Structured page content used for extraction and indexing.
     * @param pageData.basics.url - Canonical page URL used to derive the dataset name.
     * @returns Promise resolving to the dataset name where documents were indexed.
     *
     * @throws {Error} If no documents are extracted from the page.
     * @throws {Error} If indexing fails in the vector storage backend.
     */
    async indexPage(pageData: PageData): Promise<string> {
        const docs = await this.extractor.extract(pageData);
        if (docs.length === 0) {
            throw new Error('Nothing to index');
        }
        const datasetName = this.createDatasetName(pageData.basics.url);
        try {
            await this.vectorStore.index(datasetName, docs);
            console.log(`[Indexer] Indexed ${datasetName} with ${docs.length} documents for ${pageData.basics.url}`);
            return datasetName;
        } catch (error) {
            console.error(`[Indexer] Error while indexing ${pageData.basics.url}:`, error);
            throw error;
        }
    }

    /**
     * Searches indexed content for a given page URL.
     *
     * @param url - Page URL whose dataset will be queried.
     * @param query - Natural language query text.
     * @param options - Retrieval options including number of results and optional type filter.
     * @returns Promise resolving to an array of retrieved documents.
     *
     * @throws {Error} If the underlying dataset cannot be found or queried.
     */
    async searchForUrl(url: string, query: string, options: RetrieveOptions): Promise<RetrievedDocument[]> {
        const datasetName = this.createDatasetName(url);
        console.log(`[Indexer] Searching in ${datasetName} for url: ${url}`);
        return this.search(datasetName, query, options);
    }

    /**
     * Searches indexed content for a given page
     *
     * @param pageData - Structured page content containing the URL to search.
     * @param query - Natural language query text.
     * @param options - Retrieval options including number of results and optional type filter.
     *
     * @throws {Error} If the underlying dataset cannot be found or queried.
     */
    async searchForPage(pageData: PageData, query: string, options: RetrieveOptions): Promise<RetrievedDocument[]> {
        const datasetName = this.createDatasetName(pageData.basics.url);
        console.log(`[Indexer] Searching in ${datasetName} for Page with url: ${pageData.basics.url}`);
        return this.search(datasetName, query, options);
    }

    private async search(datasetName: string, query: string, options: RetrieveOptions): Promise<RetrievedDocument[]> {
        try {
            const searchResults = await this.vectorStore.retrieve(datasetName, query, options);
            if (this.verbose) {
                console.log(`[Indexer] Search results in ${datasetName} for "${query}":`, searchResults);
            }
            return searchResults;
        } catch (error) {
            console.error(`[Indexer] Error while searching in ${datasetName}:`, error);
            throw error;
        }
    }

    private createDatasetName(url: string, type: string = 'page'): string {
        const hash = createHash('md5').update(url).digest('hex').slice(0, 16);
        return `${this.datasetPref}_${type}_${hash}`.slice(0, 63);
    }
}
