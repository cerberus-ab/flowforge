import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import { PageContextProvider } from '#self/indexer';
import type { ToolGetPageSummaryResult } from '#self/types';

export class ToolGetPageSummary extends AbstractCallableTool {
    private readonly elementsHeadingsLimit: number;
    private readonly elementsInteractionsLimit: number;

    constructor(params: { elementsHeadingsLimit: number; elementsInteractionsLimit: number }) {
        super('get_page_summary');
        this.elementsHeadingsLimit = params.elementsHeadingsLimit;
        this.elementsInteractionsLimit = params.elementsInteractionsLimit;
    }

    override async callFn(ctx: PageContextProvider, query: string): Promise<ToolGetPageSummaryResult> {
        // Extract top headings
        const sampleHeadings = ctx.pageData.content
            .filter((el) => ['h1', 'h2'].includes(el.tag))
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, this.elementsHeadingsLimit)
            .map((el) => `${el.tag}:${el.text}`);

        // Extract top interactions
        const sampleInteractions = ctx.pageData.interactive
            .filter((el) => el.labels.length > 0 || el.text)
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, this.elementsInteractionsLimit)
            .map((el) => `${el.type}:${el.labels[0]?.value ?? el.text}`);

        return {
            title: ctx.pageData.basics.title,
            url: ctx.pageData.basics.url,
            description: ctx.pageData.basics.description,
            language: ctx.pageData.basics.language,
            sampleHeadings: sampleHeadings.join(' | '),
            sampleInteractions: sampleInteractions.join(' | '),
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
