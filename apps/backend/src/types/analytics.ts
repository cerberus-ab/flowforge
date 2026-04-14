export interface AnalyticsEvent {
    question: string;
    agentToolCalls: string[];
    timestamp: number;
}

// by domain, by pageUrl
export type AnalyticsData = Map<string, Map<string, AnalyticsEvent[]>>;
