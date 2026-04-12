import { AbstractDocumentExtractor } from './AbstractDocumentExtractor.ts';
import type { IndexableDocument } from '#self/types';
import type { InteractiveElement, PageData } from '@flowforge/shared';

export class InteractiveElementExtractor extends AbstractDocumentExtractor {
    constructor() {
        super('interactive_elements');
    }

    override async extractFn(pageData: PageData): Promise<IndexableDocument[]> {
        const docs: IndexableDocument[] = [];
        for (const el of pageData.interactive) {
            const content = this.createContent(el);
            docs.push(this.createDocument(content, 'interactive', el));
        }
        return docs;
    }

    private createContent(el: InteractiveElement): string {
        const parts: string[] = [];

        parts.push(this.createInteractiveActionText(el));
        parts.push(`role ${el.role}`);

        if (el.labels.length > 0) {
            parts.push(`labels "${el.labels.map((label) => label.value).join('" | "')}"`);
        }
        if (el.text) {
            parts.push(`text "${el.text}"`);
        }
        const stateParts = this.createInteractiveStateText(el);
        if (stateParts.length > 0) {
            parts.push(`state ${stateParts.join(', ')}`);
        }
        const contextParts = this.createBaseContextText(el);
        parts.push(...contextParts);

        return parts.join('. ');
    }

    private createInteractiveActionText(el: InteractiveElement): string {
        switch (el.type) {
            case 'button':
                return 'clickable button';
            case 'link':
                switch (el.link?.type) {
                    case 'internal':
                        return 'internal navigation link';
                    case 'external':
                        return 'external link';
                    case 'anchor':
                        return 'page anchor link';
                    case 'mailto':
                        return 'email link';
                    case 'tel':
                        return 'phone link';
                    default:
                        return 'link';
                }
            case 'select':
                return 'selectable element';
            case 'input':
                switch (el.role) {
                    case 'checkbox':
                        return 'checkbox input';
                    case 'radio':
                        return 'radio input';
                    case 'slider':
                        return 'slider input';
                    case 'textbox':
                        return 'text input';
                    default:
                        return 'input field';
                }
            default:
                return 'interactive element';
        }
    }

    private createInteractiveStateText(el: InteractiveElement): string[] {
        const parts: string[] = [];

        if (el.state.disabled) parts.push('disabled');
        if (el.state.readonly) parts.push('readonly');
        if (el.state.required) parts.push('required');
        if (el.state.checked) parts.push('checked');
        if (el.state.selected) parts.push('selected');
        if (el.state.expanded) parts.push('expanded');
        if (el.state.pressed) parts.push('pressed');
        if (el.state.hidden) parts.push('hidden');
        return parts;
    }
}
