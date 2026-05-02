import type { ToolCallInfo } from './agent.ts';
import type { AgentResultMode } from '@flowforge/contract';

export interface TrackResult {
    answer: string;
    elements: number;
    mode: AgentResultMode;
}

export interface AnalyticsEvent {
    question: string;
    result: TrackResult;
    toolCallsList: ToolCallInfo[];
    timestamp: number;
}

// by domain, by pageUrl
export type AnalyticsData = Map<string, Map<string, AnalyticsEvent[]>>;
