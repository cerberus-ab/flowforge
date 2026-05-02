import type { IndexableDocument } from '#self/types';
import { AbstractDocumentTransformer } from './AbstractDocumentTransformer.ts';
import {
    type ContentElement,
    type PageModel,
    formatContentElement,
    formatContentElementShort,
} from '@flowforge/page-model';
import { RecursiveCharacterTextSplitter, TextSplitter } from '@langchain/textsplitters';

export const CONTENT_TEMPLATE_TEXT_PLACEHOLDER = '{{TEXT}}';
export const CONTENT_TEMPLATE_MAX_CONTEXT_RATIO = 0.2;

export class ContentElementsTransformer extends AbstractDocumentTransformer {
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

    override async transformFn(pageModel: PageModel): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];

        for (const el of pageModel.content) {
            const contentTemplate = this.createContentTemplate(el);
            const templatedChunkSize =
                this.chunkSize - contentTemplate.length + CONTENT_TEMPLATE_TEXT_PLACEHOLDER.length;

            if (el.text.length <= templatedChunkSize) {
                const templatedText = contentTemplate.replace(CONTENT_TEMPLATE_TEXT_PLACEHOLDER, el.text);
                docs.push(this.createDocument(templatedText, el));
                continue;
            }
            const splitter = this.createTextSplitter(templatedChunkSize);
            const chunks = await splitter.splitText(el.text);
            for (const chunk of chunks) {
                const templatedChunk = contentTemplate.replace(CONTENT_TEMPLATE_TEXT_PLACEHOLDER, chunk);
                docs.push(this.createDocument(templatedChunk, el));
            }
        }
        return docs;
    }

    private createContentTemplate(el: ContentElement): string {
        const template = formatContentElement(el, CONTENT_TEMPLATE_TEXT_PLACEHOLDER);
        // fallback if the template contains too many context data
        const templateContextSize = template.length - CONTENT_TEMPLATE_TEXT_PLACEHOLDER.length;
        if (templateContextSize > this.chunkSize * CONTENT_TEMPLATE_MAX_CONTEXT_RATIO) {
            return formatContentElementShort(el, CONTENT_TEMPLATE_TEXT_PLACEHOLDER);
        }
        return template;
    }
}
