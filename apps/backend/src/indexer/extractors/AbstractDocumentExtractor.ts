import type { IndexableDocument, DocumentExtractor, DocumentMetadata, DocumentType } from '#self/types';
import { randomUUID } from 'crypto';
import type { BaseElement, PageData } from '@flowforge/shared';

export abstract class AbstractDocumentExtractor implements DocumentExtractor {
    readonly name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    protected abstract extractFn(pageData: PageData): Promise<IndexableDocument[]>;

    private createDocumentId() {
        return randomUUID();
    }

    private createMetadata(type: DocumentType, el: BaseElement): DocumentMetadata {
        return {
            type,
            element: el,
        };
    }

    protected createDocument(content: string, type: DocumentType, el: BaseElement): IndexableDocument {
        return {
            id: this.createDocumentId(),
            content,
            metadata: this.createMetadata(type, el),
        };
    }

    protected createBaseContextText(el: BaseElement): string[] {
        const parts: string[] = [];

        if (el.context.sectionName) {
            parts.push(`section "${el.context.sectionName}"`);
        }
        if (el.context.path.length > 0) {
            parts.push(`path "${el.context.path.join(' > ')}"`);
        }
        return parts;
    }

    async extract(pageData: PageData): Promise<IndexableDocument[]> {
        console.log(`[Indexer] Extract via ${this.name} for ${pageData.basics.url}`);
        try {
            return await this.extractFn(pageData);
        } catch (error) {
            console.error(`[Indexer] Error extracting via ${this.name} for ${pageData.basics.url}:`, error);
            return [];
        }
    }
}
