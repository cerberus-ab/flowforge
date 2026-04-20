import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import {
    formatConcatElements,
    formatContentElementShort,
    formatInteractiveElementShort,
    PageContextProvider,
} from '#self/indexer';
import type { ToolGetPageSummaryResultData } from '#self/types';

export class ToolGetPageSummary extends AbstractCallableTool {
    private readonly elementsHeadingsLimit: number;
    private readonly elementsInteractionsLimit: number;

    constructor(params: { elementsHeadingsLimit: number; elementsInteractionsLimit: number }) {
        super('get_page_summary');
        this.elementsHeadingsLimit = params.elementsHeadingsLimit;
        this.elementsInteractionsLimit = params.elementsInteractionsLimit;
    }

    override async callFn(ctx: PageContextProvider, query: string): Promise<ToolGetPageSummaryResultData> {
        // Get top headings
        const sampleHeadings = ctx.pageModel.content
            .filter((el) => el.type === 'heading')
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, this.elementsHeadingsLimit)
            .map((el) => formatContentElementShort(el));

        // Get top interactions
        const sampleInteractions = ctx.pageModel.interactive
            .filter((el) => el.labels.length > 0 || el.text)
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, this.elementsInteractionsLimit)
            .map((el) => formatInteractiveElementShort(el));

        return {
            title: ctx.pageModel.basics.title,
            url: ctx.pageModel.basics.url,
            description: ctx.pageModel.basics.description,
            language: ctx.pageModel.basics.language,
            sampleHeadings: formatConcatElements(sampleHeadings),
            sampleInteractions: formatConcatElements(sampleInteractions),
        };
    }

    override createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: this.name,
            description: `
DESCRIPTION:
Get a high-level overview of the current page.

WHEN TO USE:
- The user asks general questions about the page
- You need context before deciding what to do next
- The request is unclear or ambiguous

WHAT IT RETURNS:
- Basic page information (title, description, language)
- Sample headings and interactions (buttons, links, inputs, etc.)

IMPORTANT:
- This tool gives general context, not specific answers
- Do not use it to find exact elements or detailed information
- Often used as a first step before other tools`,
            schema: z.object({}),
            func: async () => await this.call(ctx, ''),
        });
    }
}
