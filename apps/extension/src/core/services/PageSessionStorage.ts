import type { SessionStorage } from '@/adapters';
import { constants } from '@/constants';
import type { AgentResult, QueryResponseMetadata } from '@flowforge/contract';
import type { SnapshotMetadata } from '@flowforge/page-trail';

// page session record types
export type PageSessionDataPending = {
    question: string;
};

export type PageSessionDataCompleted = PageSessionDataPending & {
    result: AgentResult;
    metadata: QueryResponseMetadata;
    trailSnapshot: SnapshotMetadata;
};

export type PageSessionRecord = {
    url: string;
} & (
    | {
          state: 'pending';
          data: PageSessionDataPending;
      }
    | {
          state: 'completed';
          data: PageSessionDataCompleted;
      }
);

// storage class
export class PageSessionStorage {
    private readonly storage: SessionStorage;

    constructor(storage: SessionStorage) {
        this.storage = storage;
    }

    private getKey(pageId: number): string {
        return `${constants.STORAGE_NAMESPACE}_page_session::${String(pageId)}`;
    }

    private saveRecord(pageId: number, record: PageSessionRecord): Promise<void> {
        return this.storage.set(this.getKey(pageId), record);
    }

    async savePending(pageId: number, url: string, pendingData: PageSessionDataPending): Promise<void> {
        return this.saveRecord(pageId, {
            url,
            state: 'pending',
            data: pendingData,
        });
    }

    async saveCompleted(pageId: number, url: string, completedData: PageSessionDataCompleted): Promise<void> {
        return this.saveRecord(pageId, {
            url,
            state: 'completed',
            data: completedData,
        });
    }
}
