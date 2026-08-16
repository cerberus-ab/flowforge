import type { BaseElement, ElementKind, PageTrail } from '@flowforge/page-trail';

export type DocumentType = ElementKind;

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

export interface RerankedDocument extends RetrievedDocument {
    score: number;
}

export interface DocumentTransformer {
    transform(pageTrail: PageTrail): Promise<IndexableDocument[]>;
}

export interface RetrieveOptions {
    k: number;
    documentType?: DocumentType;
}

export interface DocumentRetriever {
    retrieve(query: string, params: RetrieveOptions): Promise<RetrievedDocument[]>;
}

export interface DocumentStorage {
    index(dataset: string, docs: IndexableDocument[]): Promise<void>;
    retrieve(dataset: string, query: string, params: RetrieveOptions): Promise<RetrievedDocument[]>;
    health(): Promise<boolean>;
}
