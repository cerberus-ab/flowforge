import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import { PageContextProvider } from '@/indexer';
import type { ToolFindElementResultData } from '@/types';
import { rerankRetrievedDocuments } from '../rank/reranker.ts';
import { scoreForLookup } from '../rank/scoring.ts';

export class ToolFindElement extends AbstractCallableTool {
    private readonly retrieveDocumentsLimit: number;

    constructor(params: { retrieveDocumentsLimit: number }) {
        super('find_element');
        this.retrieveDocumentsLimit = params.retrieveDocumentsLimit;
    }

    override async callFn(ctx: PageContextProvider, query: string): Promise<ToolFindElementResultData> {
        const results = await ctx.retrieve(query, {
            k: this.retrieveDocumentsLimit,
        });
        const bestMatch = rerankRetrievedDocuments(results, scoreForLookup, 1);
        if (!bestMatch[0]) {
            return {
                found: false,
                message: 'Element not found',
            };
        }
        const rd = bestMatch[0];
        return {
            found: true,
            semanticDescription: rd.content,
            ...this.getToolResultElement(rd.metadata.element),
        };
    }

    override createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: this.name,
            description: `
DESCRIPTION:
Find the most relevant UI element matching a user request.

WHEN TO USE:
- The user is looking for a specific element (button, link, input, control)
- Questions like:
    - "Where is X?"
    - "Find X"
    - "Show me X"

WHAT IT RETURNS:
- Best matching element (if any)
- semanticDescription: semantic text describing the matched element
- elementContext: semantic container breadcrumbs around the element, ordered from broader page area to nearer target area
- elementDataId: primary browser locator
- elementCssSelector: optional fallback browser locator

IMPORTANT:
- Returns only the best match, which may be imperfect
- Use elementContext to decide if it is correct and to describe where it is located
- If the result seems unclear or incomplete, consider using another tool`,
            schema: z.object({
                query: z.string().describe('Element to find (e.g., "login button", "search input")'),
            }),
            func: async ({ query }) => await this.call(ctx, query),
        });
    }
}
