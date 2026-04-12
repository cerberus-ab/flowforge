import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import { PageContextProvider } from '#self/indexer';
import type { ToolFindWorkflowResult } from '#self/types';
import { rerankRetrievedDocuments } from '../rank/reranker.ts';
import { scoreForAction } from '../rank/scoring.ts';

export class ToolFindWorkflow extends AbstractCallableTool {
    private readonly retrieveDocumentsLimit: number;
    private readonly returnDocumentsLimit: number;

    constructor(params: { retrieveDocumentsLimit: number; returnDocumentsLimit: number }) {
        super('find_workflow');
        this.retrieveDocumentsLimit = params.retrieveDocumentsLimit;
        this.returnDocumentsLimit = params.returnDocumentsLimit;
    }

    override async callFn(ctx: PageContextProvider, query: string): Promise<ToolFindWorkflowResult> {
        // Retrieve relevant interactive elements
        const results = await ctx.retrieve(query, {
            k: this.retrieveDocumentsLimit,
            documentType: 'interactive',
        });
        const rerankedResults = rerankRetrievedDocuments(results, scoreForAction, this.returnDocumentsLimit);
        const steps = rerankedResults.map((r) => ({
            semanticDescription: r.document.content,
            elementPath: r.document.metadata.element.context.path.join(' > '),
            elementSectionName: r.document.metadata.element.context.sectionName ?? '',
            elementDataId: r.document.metadata.element.dataId,
            elementSelector: r.document.metadata.element.selector,
        }));
        return { steps };
    }

    override createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: this.name,
            description: `
DESCRIPTION:
Find UI elements that may be used to complete a task.

WHEN TO USE:
- The user asks how to perform a task
- Questions like:
    - "How do I X?"
    - "Steps to X"
    - "How can I complete X?"

WHAT IT RETURNS:
- A list of relevant interactive elements (candidates)
- Each includes description, location, selector, and dataId

IMPORTANT:
- Results are candidates, not ordered steps
- Select relevant items and arrange them into a logical sequence
- Ignore irrelevant or duplicate items
- Some steps may be missing
- Use other tools if needed to clarify or validate steps`,
            schema: z.object({
                query: z.string().describe('Task to accomplish (e.g., "login", "checkout", "register")'),
            }),
            func: async ({ query }) => await this.call(ctx, query),
        });
    }
}
