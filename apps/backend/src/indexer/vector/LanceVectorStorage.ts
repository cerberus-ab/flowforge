import path from 'node:path';
import * as lancedb from '@lancedb/lancedb';
import type {
    DocumentMetadata,
    DocumentVectorStorage,
    EmbeddingProvider,
    IndexableDocument,
    RetrievedDocument,
    RetrieveOptions,
} from '#self/types';

const DEFAULT_DB_PATH = './data/lancedb';

export class LanceVectorStorage implements DocumentVectorStorage {
    private readonly dbPath: string;
    private readonly embeddingProvider: EmbeddingProvider;

    constructor(embeddingProvider: EmbeddingProvider, dbPath: string = DEFAULT_DB_PATH) {
        this.dbPath = path.resolve(dbPath);
        this.embeddingProvider = embeddingProvider;
    }

    async index(dataset: string, docs: IndexableDocument[]): Promise<void> {
        const conn = await this.connect();
        const contentEmbeddings = await this.embeddingProvider.embed(docs.map((doc) => doc.content));

        const rows = docs.map((doc, index) => ({
            id: doc.id,
            type: doc.metadata.type,
            content: doc.content,
            metadata_json: JSON.stringify(doc.metadata),
            vector: contentEmbeddings[index],
        }));
        await conn.createTable(dataset, rows, { mode: 'overwrite' });
    }

    async retrieve(dataset: string, query: string, options: RetrieveOptions): Promise<RetrievedDocument[]> {
        const conn = await this.connect();
        const table = await conn.openTable(dataset);
        const queryEmbedding = await this.embeddingProvider.embedQuery(query);

        let vectorQuery = table
            .query()
            .nearestTo(queryEmbedding)
            .select(['content', 'metadata_json', '_distance'])
            .limit(options.k);
        // filter by type if provided
        if (options.documentType) {
            vectorQuery = vectorQuery.where(`type = '${options.documentType}'`);
        }
        const results = await vectorQuery.toArray();

        return results.map((row: unknown) => {
            const record = row as {
                content: string;
                metadata_json: string;
                _distance?: number;
            };
            return {
                content: record.content,
                metadata: JSON.parse(record.metadata_json) as DocumentMetadata,
                semanticScore: typeof record._distance === 'number' ? 1 / (1 + record._distance) : 0,
            };
        });
    }

    async health(): Promise<boolean> {
        await this.connect();
        return true;
    }

    private async connect(): Promise<lancedb.Connection> {
        return lancedb.connect(this.dbPath);
    }
}
