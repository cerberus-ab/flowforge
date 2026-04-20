import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import { PageContextProvider } from '#self/indexer';
import type { ToolSearchInContentResultData } from '#self/types';
import { rerankRetrievedDocuments } from '../rank/reranker.ts';
import { scoreForAnswer } from '../rank/scoring.ts';

export class ToolSearchInContent extends AbstractCallableTool {
    private readonly retrieveDocumentsLimit: number;
    private readonly returnDocumentsLimit: number;

    constructor(params: { retrieveDocumentsLimit: number; returnDocumentsLimit: number }) {
        super('search_in_content');
        this.retrieveDocumentsLimit = params.retrieveDocumentsLimit;
        this.returnDocumentsLimit = params.returnDocumentsLimit;
    }

    override async callFn(ctx: PageContextProvider, query: string): Promise<ToolSearchInContentResultData> {
        // Retrieve relevant content elements
        const results = await ctx.retrieve(query, {
            k: this.retrieveDocumentsLimit,
            documentType: 'content',
        });
        const reranked = rerankRetrievedDocuments(results, scoreForAnswer, this.returnDocumentsLimit);
        const content = reranked.map((rd) => ({
            text: rd.content,
            ...this.getToolResultElement(rd.metadata.element),
        }));
        return { content };
    }

    override createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: this.name,
            description: `
DESCRIPTION:
Search the page text for information about a topic.

WHEN TO USE:
- The user asks about content or information on the page
- Questions like:
    - "What does it say about X?"
    - "Tell me about X"
    - "Is there information about X?"

WHAT IT RETURNS:
- Relevant content fragments from the page
- Each fragment includes text and location context

IMPORTANT:
- Results are partial matches, not guaranteed answers
- You must interpret and combine them into a final answer
- If needed, you can follow up with another tool to locate related elements`,
            schema: z.object({
                query: z.string().describe('Topic to search for'),
            }),
            func: async ({ query }) => await this.call(ctx, query),
        });
    }
}
