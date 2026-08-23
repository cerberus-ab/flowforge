import { PageContextProvider } from '@/indexer';

export interface CallableTool {
    call(ctx: PageContextProvider, query: string): Promise<string>;
}

export type CallableToolSuccessResult<T> = {
    success: true;
} & T;

export type CallableToolFailureResult = {
    success: false;
    error: string;
};

export type CallableToolResultData =
    | ToolGetPageSummaryResultData
    | ToolFindElementResultData
    | ToolSearchInContentResultData
    | ToolFindWorkflowResultData
    | ToolSuggestActionsResultData;

export type CallableToolResult = CallableToolSuccessResult<CallableToolResultData> | CallableToolFailureResult;

// Tools result data

export interface ToolResultPageAbout {
    title: string;
    description: string;
}

export interface ToolGetPageSummaryResultData extends ToolResultPageAbout {
    url: string;
    language: string;
    sampleHeadings: string[];
    sampleInteractions: string[];
}

export interface ToolResultElement {
    elementDataId: string;
    elementContext: string[];
    elementCssSelector?: string;
}

export interface ToolSuggestActionsResultData extends ToolResultPageAbout {
    actions: ({ semanticDescription: string } & ToolResultElement)[];
}

export interface ToolFindElementFoundResultData extends ToolResultElement {
    found: true;
    semanticDescription: string;
}

export interface ToolFindElementNotFoundResultData {
    found: false;
    message: string;
}

export type ToolFindElementResultData = ToolFindElementFoundResultData | ToolFindElementNotFoundResultData;

export interface ToolSearchInContentResultData {
    content: ({ text: string } & ToolResultElement)[];
}

export interface ToolFindWorkflowResultData {
    steps: ({ semanticDescription: string } & ToolResultElement)[];
}
