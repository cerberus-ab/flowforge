import type { DynamicStructuredTool } from '@langchain/core/tools';
import { PageContextProvider } from '#self/indexer';
import type { CallableTool, CallableToolResult } from '#self/types';

export abstract class AbstractCallableTool implements CallableTool {
    readonly name: string;

    protected constructor(name: string) {
        this.name = name;
    }

    protected abstract callFn(contextProvider: PageContextProvider, query: string): Promise<CallableToolResult>;

    abstract createStructuredTool(ctx: PageContextProvider): DynamicStructuredTool;

    async call(ctx: PageContextProvider, query: string): Promise<string> {
        console.log(`[Tool] Call ${this.name} for ${ctx.pageData.basics.url}: ${query}`);
        try {
            const result = await this.callFn(ctx, query);
            return AbstractCallableTool.serialiseResult({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error(`[Tool] Error calling ${this.name} for ${ctx.pageData.basics.url}:`, error);
            return AbstractCallableTool.serialiseResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    private static serialiseResult(result: unknown): string {
        return JSON.stringify(result, null, 2);
    }
}
