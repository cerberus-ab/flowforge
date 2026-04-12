import type { AnalyticsData, AnalyticsEvent } from '#self/types';

// TODO: provide a persistence layer
export class Analytics {
    private readonly data: AnalyticsData = new Map<string, Map<string, AnalyticsEvent[]>>();

    constructor() {}

    track(domain: string, pageUrl: string, event: AnalyticsEvent): void {
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
