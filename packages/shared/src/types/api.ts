import { PageData } from './pageData.ts';
import { AgentResult } from './agentResult.ts';

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

export interface QueryResponse {
    result: AgentResult;
}
