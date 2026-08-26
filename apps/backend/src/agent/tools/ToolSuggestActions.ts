import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import { PageContextProvider } from '@/indexer';
import type { ToolSuggestActionsResultData } from '@/types';
import { semInteractiveElement, type InteractiveElement } from '@flowforge/page-trail';

export class ToolSuggestActions extends AbstractCallableTool {
    private readonly elementsInteractiveLimit: number;

    constructor(params: { elementsInteractiveLimit: number }) {
        super('suggest_actions');
        this.elementsInteractiveLimit = params.elementsInteractiveLimit;
    }

    override async callFn(ctx: PageContextProvider): Promise<ToolSuggestActionsResultData> {
        return {
            title: ctx.pageTrail.basics.title,
            description: ctx.pageTrail.basics.description,
            actions: this.collectActions(ctx),
        };
    }

    private collectActions(ctx: PageContextProvider) {
        return [...ctx.pageTrail.interactive]
            .filter((element) => this.isUsableAction(element))
            .sort((a, b) => b.importanceScore.value - a.importanceScore.value)
            .slice(0, this.elementsInteractiveLimit)
            .map((element) => ({
                semanticDescription: semInteractiveElement(element).text(),
                ...this.getToolResultElement(element),
            }));
    }

    private isUsableAction(element: InteractiveElement): boolean {
        return !element.state.hidden && !element.state.disabled && !element.state.readonly;
    }

    override createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: this.name,
            description: `
DESCRIPTION:
Suggest useful actions available on the current page.

WHEN TO USE:
- Query requests open-ended available actions or options without a specific goal
- Examples:
    - "What can I do here?"
    - "What are my options?"
    - "Show available actions"

WHAT IT RETURNS:
- title and description describe the current page and should be used as page-level context
- A list of relevant interactive action candidates
- Each action includes semanticDescription, elementContext, elementDataId, and optional elementCssSelector
- elementContext contains semantic scope breadcrumbs that hint what the action is about, ordered from broader page area to nearer target area
- elementDataId is the primary browser locator; elementCssSelector is only an optional fallback

IMPORTANT:
- Results are candidate actions, not workflow steps
- Use title and description to understand the page purpose before selecting and labeling actions
- Do not copy title or description into final action labels unless needed for clarity
- Select a concise set of useful, distinct actions
- Ignore irrelevant, duplicate, disabled, or unclear candidates
- Use elementContext to write action labels with the right topic or scope`,
            schema: z.object({
                query: z
                    .string()
                    .describe(
                        'Action discovery request. This is used for logging only; action candidates are selected from the current page structure.',
                    ),
            }),
            func: async ({ query }) => await this.call(ctx, query),
        });
    }
}
