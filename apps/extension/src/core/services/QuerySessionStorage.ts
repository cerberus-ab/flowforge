import type { SessionStorage } from '@/adapters';
import { constants } from '@/constants';
import type { AgentResult, QueryResponseMetadata } from '@flowforge/contract';
import type { SnapshotMetadata } from '@flowforge/page-trail';

// page session record types
export type QuerySessionDataPending = {
    question: string;
};

export type QuerySessionDataCompleted = QuerySessionDataPending & {
    result: AgentResult;
    metadata: QueryResponseMetadata;
    trailSnapshot: SnapshotMetadata;
};

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
    url: string;
} & QuerySessionData;

// storage class
export class QuerySessionStorage {
    private readonly storage: SessionStorage;

    constructor(storage: SessionStorage) {
        this.storage = storage;
    }

    private getKey(pageId: number): string {
        return `${constants.STORAGE_NAMESPACE}_query_session::${String(pageId)}`;
    }

    private saveRecord(pageId: number, record: QuerySessionRecord): Promise<void> {
        return this.storage.set(this.getKey(pageId), record);
    }

    savePending(pageId: number, url: string, pendingData: QuerySessionDataPending): Promise<void> {
        return this.saveRecord(pageId, {
            url,
            state: 'pending',
            data: pendingData,
        });
    }

    saveCompleted(pageId: number, url: string, completedData: QuerySessionDataCompleted): Promise<void> {
        return this.saveRecord(pageId, {
            url,
            state: 'completed',
            data: completedData,
        });
    }

    getRecord(pageId: number): Promise<QuerySessionRecord | null> {
        return this.storage.get<QuerySessionRecord>(this.getKey(pageId));
    }

    removeRecord(pageId: number): Promise<void> {
        return this.storage.remove(this.getKey(pageId));
    }
}
