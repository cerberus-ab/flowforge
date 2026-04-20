import { PageContextProvider } from '#self/indexer';

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
    | ToolFindWorkflowResultData;

export type CallableToolResult = CallableToolSuccessResult<CallableToolResultData> | CallableToolFailureResult;

// Tools result data

export interface ToolGetPageSummaryResultData {
    title: string;
    url: string;
    description: string;
    language: string;
    sampleHeadings: string;
    sampleInteractions: string;
}

export interface ToolResultElement {
    elementPath: string;
    elementSectionName: string;
    elementDataId: string;
    elementSelector: string;
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
