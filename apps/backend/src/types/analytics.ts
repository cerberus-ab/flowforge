export interface AnalyticsEvent {
    question: string;
    timestamp: number;
    agentSuccess: boolean;
    agentToolCalls: string[];
}

// by domain, by pageUrl
export type AnalyticsData = Map<string, Map<string, AnalyticsEvent[]>>;
