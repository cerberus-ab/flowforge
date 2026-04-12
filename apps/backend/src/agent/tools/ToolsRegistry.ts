import { DynamicStructuredTool } from '@langchain/core/tools';
import { AbstractCallableTool } from './AbstractCallableTool.ts';
import { ToolFindElement } from './ToolFindElement.ts';
import { ToolGetPageSummary } from './ToolGetPageSummary.ts';
import { ToolFindWorkflow } from './ToolFindWorkflow.ts';
import { ToolSearchInContent } from './ToolSearchInContent.ts';
import { PageContextProvider } from '#self/indexer';

export class ToolsRegistry {
    private readonly tools: AbstractCallableTool[];

    constructor() {
        this.tools = [
            new ToolFindElement({
                retrieveDocumentsLimit: 5,
            }),
            new ToolGetPageSummary({
                elementsHeadingsLimit: 5,
                elementsButtonsLimit: 10,
            }),
            new ToolFindWorkflow({
                retrieveDocumentsLimit: 20,
                returnDocumentsLimit: 10,
            }),
            new ToolSearchInContent({
                retrieveDocumentsLimit: 10,
                returnDocumentsLimit: 5,
            }),
        ];
    }

    list(): string[] {
        return this.tools.map((tool) => tool.name);
    }

    createStructuredTools(contextProvider: PageContextProvider): DynamicStructuredTool[] {
        return this.tools.map((tool) => tool.createStructuredTool(contextProvider));
    }
}
