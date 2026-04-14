import type { AgentResult, UsageMetadata } from '@flowforge/shared';

export interface ToolCallInfo {
    order: number;
    name: string;
    args: Record<string, unknown>;
}

export interface AgentExecResult {
    model: string;
    humanMessageContent: string;
    lastAiMessageContent: string;
    toolCallsList: ToolCallInfo[];
    usageMetadata: UsageMetadata;
}

export interface AgentResponse {
    result: AgentResult;
    execResult: AgentExecResult;
    execTimeMs: number;
}
