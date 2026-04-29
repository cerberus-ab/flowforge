import type { AgentResponse, AnalyticsData, AnalyticsEvent } from '#self/types';

// TODO: provide a persistence layer
export class Analytics {
    private readonly data: AnalyticsData = new Map<string, Map<string, AnalyticsEvent[]>>();

    /**
     * Records a Q&A interaction for analytics.
     *
     * Stores the user question, summarized agent result,
     * tool calls, and timestamp scoped by domain and page.
     */
    trackQA(domain: string, pageUrl: string, question: string, agentResponse: AgentResponse): void {
        this.track(domain, pageUrl, {
            question,
            result: {
                answer: agentResponse.result.answer,
                elements: agentResponse.result.elements.length,
                mode: agentResponse.result.mode,
            },
            toolCallsList: agentResponse.execResult.toolCallsList,
            timestamp: Date.now(),
        });
    }

    private track(domain: string, pageUrl: string, event: AnalyticsEvent): void {
        let domainData = this.data.get(domain);
        if (!domainData) {
            domainData = new Map<string, AnalyticsEvent[]>();
            this.data.set(domain, domainData);
        }
        let pageEvents = domainData.get(pageUrl);
        if (!pageEvents) {
            pageEvents = [];
            domainData.set(pageUrl, pageEvents);
        }
        pageEvents.push(event);
    }

    getByDomain(domain: string): Map<string, AnalyticsEvent[]> | undefined {
        return this.data.get(domain);
    }

    getByPage(domain: string, pageUrl: string): AnalyticsEvent[] {
        return this.data.get(domain)?.get(pageUrl) ?? [];
    }

    getAll(): AnalyticsData {
        return this.data;
    }

    clear(): void {
        this.data.clear();
    }
}
