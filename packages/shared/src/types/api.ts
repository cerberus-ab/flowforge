import type { PageData } from './pageData.ts';
import type { AgentResult, UsageMetadata } from './agentResult.ts';

// POST: /query

export interface UserContext {
    previousQuestions: string[];
}

export interface QueryRequest {
    question: string;
    pageData: PageData;
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
