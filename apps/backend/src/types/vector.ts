import type { BaseElement, PageData } from '@flowforge/shared';

export type DocumentType = 'content' | 'interactive';

export interface DocumentMetadata {
    type: DocumentType;
    element: BaseElement;
}

export interface Document {
    content: string;
    metadata: DocumentMetadata;
}

export interface IndexableDocument extends Document {
    id: string;
}

export interface RetrievedDocument extends Document {
    semanticScore: number; // [0..1]
}

export interface DocumentExtractor {
    extract(pageData: PageData): Promise<IndexableDocument[]>;
}

export interface RetrieveOptions {
    k: number;
    documentType?: DocumentType;
}

export interface DocumentRetriever {
    retrieve(query: string, params: RetrieveOptions): Promise<RetrievedDocument[]>;
}

export interface DocumentVectorStorage {
    index(dataset: string, docs: IndexableDocument[]): Promise<void>;
    retrieve(dataset: string, query: string, params: RetrieveOptions): Promise<RetrievedDocument[]>;
    health(): Promise<boolean>;
}
