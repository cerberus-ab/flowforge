import type { PageTrailDto } from '@flowforge/page-trail';
import type { AgentResult, UsageMetadata } from './agentResult.ts';

// POST: /query

export interface UserContext {
    previousQuestions: string[];
}

export interface QueryRequest {
    question: string;
    pageTrailDto: PageTrailDto;
    domain: string;
    userContext?: UserContext;
}

export interface QueryResponseMetadata {
    model: string;
    usage: UsageMetadata;
    execTimeMs: number;
}

export interface QueryResponse {
    result: AgentResult;
    metadata: QueryResponseMetadata;
}
