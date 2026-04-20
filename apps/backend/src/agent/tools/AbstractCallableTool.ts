import type { DynamicStructuredTool } from '@langchain/core/tools';
import { formantElementContextPath, PageContextProvider } from '#self/indexer';
import type { CallableTool, CallableToolResult, CallableToolResultData, ToolResultElement } from '#self/types';
import type { BaseElement } from '@flowforge/shared';

export abstract class AbstractCallableTool implements CallableTool {
    readonly name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    protected abstract callFn(
        contextProvider: PageContextProvider,
        query: string,
    ): Promise<CallableToolResultData>;

    abstract createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool;

    async call(ctx: PageContextProvider, query: string): Promise<string> {
        console.log(`[Tool] Call ${this.name} for ${ctx.pageModel.basics.url}: ${query}`);
        try {
            const resultData = await this.callFn(ctx, query);
            const result: CallableToolResult = {
                success: true,
                ...resultData,
            };
            return AbstractCallableTool.serialiseResult(result);
        } catch (error) {
            console.error(`[Tool] Error calling ${this.name} for ${ctx.pageModel.basics.url}:`, error);
            const result: CallableToolResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            return AbstractCallableTool.serialiseResult(result);
        }
    }

    protected getToolResultElement(element: BaseElement): ToolResultElement {
        return {
            elementPath: formantElementContextPath(element.context.path),
            elementSectionName: element.context.sectionName ?? '',
            elementDataId: element.dataId,
            elementSelector: element.selector,
        };
    }

    private static serialiseResult(result: CallableToolResult): string {
        return JSON.stringify(result, null, 2);
    }
}
