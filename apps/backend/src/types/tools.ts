import { PageContextProvider } from '#self/indexer';

export interface CallableTool {
    call(ctx: PageContextProvider, query: string): Promise<string>;
}

export type CallableToolResult = Record<string, unknown>;

export interface ToolGetPageSummaryResult extends CallableToolResult {
    title: string;
    url: string;
    description: string;
    language: string;
    sampleHeadings: string;
    sampleButtons: string;
}

export interface ToolResultElement {
    elementPath: string;
    elementSectionName: string;
    elementDataId: string;
    elementSelector: string;
}

export interface ToolFindElementFoundResult extends CallableToolResult, ToolResultElement {
    success: true;
    semanticDescription: string;
    confidence: number;
}

export interface ToolFindElementNotFoundResult extends CallableToolResult {
    success: false;
    message: string;
}

export type ToolFindElementResult = ToolFindElementFoundResult | ToolFindElementNotFoundResult;

export interface ToolSearchInContentResult extends CallableToolResult {
    content: ({ text: string } & ToolResultElement)[];
}

export interface ToolFindWorkflowResult extends CallableToolResult {
    steps: ({ semanticDescription: string } & ToolResultElement)[];
}
