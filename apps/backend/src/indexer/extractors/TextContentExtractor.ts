import type { IndexableDocument } from '#self/types';
import { AbstractDocumentExtractor } from './AbstractDocumentExtractor.ts';
import type { ContentElement, PageData } from '@flowforge/shared';
import { RecursiveCharacterTextSplitter, TextSplitter } from '@langchain/textsplitters';

const CONTENT_TEMPLATE_TEXT_PLACEHOLDER = '{{TEXT}}';
const CONTENT_TEMPLATE_MAX_CONTEXT_RATIO = 0.2;

export class TextContentExtractor extends AbstractDocumentExtractor {
    private readonly chunkSize: number;
    private readonly chunkOverlapRatio: number;

    constructor(params: { chunkSize: number; chunkOverlapRatio: number }) {
        super('text_content');
        this.chunkSize = params.chunkSize;
        this.chunkOverlapRatio = params.chunkOverlapRatio;
    }

    private createTextSplitter(chunkSize: number): TextSplitter {
        const chunkOverlap = Math.round(this.chunkOverlapRatio * chunkSize);

        return new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
            separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
            keepSeparator: true,
        });
    }

    override async extractFn(pageData: PageData): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];

        for (const el of pageData.content) {
            const contentTemplate = this.createContentTemplate(el);
            const templatedChunkSize =
                this.chunkSize - contentTemplate.length + CONTENT_TEMPLATE_TEXT_PLACEHOLDER.length;

            if (el.text.length <= templatedChunkSize) {
                const templatedText = contentTemplate.replace(CONTENT_TEMPLATE_TEXT_PLACEHOLDER, el.text);
                docs.push(this.createDocument(templatedText, 'content', el));
                continue;
            }
            const splitter = this.createTextSplitter(templatedChunkSize);
            const chunks = await splitter.splitText(el.text);
            for (const chunk of chunks) {
                const templatedChunk = contentTemplate.replace(CONTENT_TEMPLATE_TEXT_PLACEHOLDER, chunk);
                docs.push(this.createDocument(templatedChunk, 'content', el));
            }
        }
        return docs;
    }

    private createContentTemplate(el: ContentElement): string {
        const parts: string[] = [];

        const contentType = el.type === 'heading' ? 'heading' : 'text';
        parts.push(contentType);
        parts.push(CONTENT_TEMPLATE_TEXT_PLACEHOLDER);
        const contextParts = this.createBaseContextText(el);
        parts.push(...contextParts);

        const template = parts.join('. ');
        // fallback if the template contains too many context data
        const templateContextSize = template.length - CONTENT_TEMPLATE_TEXT_PLACEHOLDER.length;
        if (templateContextSize > this.chunkSize * CONTENT_TEMPLATE_MAX_CONTEXT_RATIO) {
            return `${contentType}. ${CONTENT_TEMPLATE_TEXT_PLACEHOLDER}`;
        }
        return template;
    }
}
