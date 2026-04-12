import type { AgentResult } from '@flowforge/shared';

export interface ToolCallInfo {
    order: number;
    name: string;
    args: Record<string, unknown>;
}

export interface AgentExecResult {
    humanMessageContent: string;
    lastAiMessageContent: string;
    toolCallsList: ToolCallInfo[];
}

export interface AgentResponse {
    success: boolean;
    result: AgentResult;
    execTimeMs: number;
    execResult: AgentExecResult | null;
}
