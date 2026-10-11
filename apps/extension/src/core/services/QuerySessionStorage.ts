import type { SessionStorage } from '@/adapters';
import { constants } from '@/constants';
import type { AgentResult, QueryResponseMetadata } from '@flowforge/contract';
import type { SnapshotMetadata } from '@flowforge/page-trail';

// page session record types
export type QuerySessionDataPending = {
    question: string;
};

export type QuerySessionDataAnswer = {
    result: AgentResult;
    metadata: QueryResponseMetadata;
    trailSnapshot: SnapshotMetadata;
};

export type QuerySessionDataCompleted = QuerySessionDataPending & (QuerySessionDataAnswer | { error: string });

export type QuerySessionData =
    | {
          state: 'pending';
          data: QuerySessionDataPending;
      }
    | {
          state: 'completed';
          data: QuerySessionDataCompleted;
      };

export type QuerySessionRecord = {
    queryId: string;
    url: string;
} & QuerySessionData;

/**
 * Stores one query lifecycle record per page and validates each state transition by query ID.
 * TODO: Use compare-and-set for transitions when the storage adapter supports it.
 */
export class QuerySessionStorage {
    private readonly storage: SessionStorage;

    /** Creates a query session store backed by session storage. */
    constructor(storage: SessionStorage) {
        this.storage = storage;
    }

    private getKey(pageId: number): string {
        return `${constants.STORAGE_NAMESPACE}_query_session::${String(pageId)}`;
    }

    private saveRecord(pageId: number, record: QuerySessionRecord): Promise<void> {
        return this.storage.set(this.getKey(pageId), record);
    }

    /** Saves a new query in the pending state, replacing any previous query for the page. */
    savePending(pageId: number, queryId: string, url: string, pendingData: QuerySessionDataPending): Promise<void> {
        return this.saveRecord(pageId, { queryId, url, state: 'pending', data: pendingData });
    }

    /** Saves the query outcome only if the matching query is still pending. */
    async updateCompleted(
        pageId: number,
        queryId: string,
        completedData: QuerySessionDataAnswer | { error: string },
    ): Promise<boolean> {
        const record = await this.getRecord(pageId);
        if (record == null || record.queryId !== queryId || record.state !== 'pending') return false;

        await this.saveRecord(pageId, {
            queryId,
            url: record.url,
            state: 'completed',
            data: {
                ...completedData,
                question: record.data.question,
            },
        });
        return true;
    }

    /** Returns the saved query session for a page, or null when none exists. */
    getRecord(pageId: number): Promise<QuerySessionRecord | null> {
        return this.storage.get<QuerySessionRecord>(this.getKey(pageId));
    }

    /** Removes the saved query session for a page. */
    removeRecord(pageId: number): Promise<void> {
        return this.storage.remove(this.getKey(pageId));
    }
}
