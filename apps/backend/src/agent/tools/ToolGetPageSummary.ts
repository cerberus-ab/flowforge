import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import { PageContextProvider } from '@/indexer';
import type { ToolGetPageSummaryResultData } from '@/types';
import { semSampleHeadings, semSampleInteractions } from '@flowforge/page-trail';

export class ToolGetPageSummary extends AbstractCallableTool {
    private readonly elementsHeadingsLimit: number;
    private readonly elementsInteractionsLimit: number;

    constructor(params: { elementsHeadingsLimit: number; elementsInteractionsLimit: number }) {
        super('get_page_summary');
        this.elementsHeadingsLimit = params.elementsHeadingsLimit;
        this.elementsInteractionsLimit = params.elementsInteractionsLimit;
    }

    override async callFn(ctx: PageContextProvider): Promise<ToolGetPageSummaryResultData> {
        return {
            title: ctx.pageTrail.basics.title,
            url: ctx.pageTrail.basics.url,
            description: ctx.pageTrail.basics.description,
            language: ctx.pageTrail.basics.language,
            sampleHeadings: semSampleHeadings(ctx.pageTrail.content, this.elementsHeadingsLimit),
            sampleInteractions: semSampleInteractions(ctx.pageTrail.interactive, this.elementsInteractionsLimit),
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
