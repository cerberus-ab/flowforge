import type { Request, Response } from 'express';
import type { AnalyticsResponse } from '#self/types';
import { Analytics } from '#self/analytics';

interface AnalyticsHandlerDeps {
    analytics: Analytics;
}

export function createAnalyticsHandler({ analytics  }: AnalyticsHandlerDeps) {
    return function handleAnalytics(_req: Request, res: Response<AnalyticsResponse>): void {
        res.json({
            data: Object.fromEntries(
                Array.from(analytics.getAll()).map(([domain, pages]) => [domain, Object.fromEntries(pages)]),
            ),
            timestamp: new Date().toISOString(),
        });
    };
}
