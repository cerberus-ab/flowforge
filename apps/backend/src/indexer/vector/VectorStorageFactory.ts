import type { DocumentStorage, EmbeddingProvider } from '#self/types';
import { LanceVectorStorage } from './LanceVectorStorage.ts';

/**
 * Factory for creating document vector storage instances.
 */
export class VectorStorageFactory {
    static create(embeddingProvider: EmbeddingProvider): DocumentStorage {
        return new LanceVectorStorage(embeddingProvider);
    }
}
