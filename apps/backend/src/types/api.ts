import type { AnalyticsEvent } from './analytics.ts';

// GET: /health
export interface HealthResponse {
    status: 'ok';
    service: string;
    timestamp: string;
}

// POST: /query

export type { UserContext, QueryRequest, QueryResponse } from '@flowforge/shared';

// POST: /search
export interface SearchRequest {
    pageUrl: string;
    query: string;
    k?: number;
}

export interface SearchResponse<T = unknown> {
    results: T[];
}

// GET: /analytics
export type AnalyticsResponseData = Record<string, Record<string, AnalyticsEvent[]>>;

export interface AnalyticsResponse {
    data: AnalyticsResponseData;
    timestamp: string;
}

// error response
export interface ErrorResponse {
    error: string;
    message?: string;
}
