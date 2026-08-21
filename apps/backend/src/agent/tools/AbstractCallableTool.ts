import type { DynamicStructuredTool } from '@langchain/core/tools';
import { PageContextProvider } from '@/indexer';
import type { CallableTool, CallableToolResult, CallableToolResultData, ToolResultElement } from '@/types';
import { semElementContextBreadcrumbs, type TargetElement } from '@flowforge/page-trail';

export abstract class AbstractCallableTool implements CallableTool {
    readonly name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    protected abstract callFn(contextProvider: PageContextProvider, query: string): Promise<CallableToolResultData>;

    abstract createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool;

    async call(ctx: PageContextProvider, query: string): Promise<string> {
        console.log(`[Tool] Call ${this.name} for ${ctx.pageTrail.basics.url}: ${query}`);
        try {
            const resultData = await this.callFn(ctx, query);
            const result: CallableToolResult = {
                success: true,
                ...resultData,
            };
            return AbstractCallableTool.serialiseResult(result);
        } catch (error) {
            console.error(`[Tool] Error calling ${this.name} for ${ctx.pageTrail.basics.url}:`, error);
            const result: CallableToolResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            return AbstractCallableTool.serialiseResult(result);
        }
    }

    protected getToolResultElement(element: TargetElement): ToolResultElement {
        return {
            elementDataId: element.dataId,
            elementContext: semElementContextBreadcrumbs(element.context),
            elementCssSelector: element.cssSelector,
        };
    }

    private static serialiseResult(result: CallableToolResult): string {
        return JSON.stringify(result, null, 2);
    }
}
