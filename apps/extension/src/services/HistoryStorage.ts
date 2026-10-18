import type { LocalStorage } from '@/adapters';
import { constants } from '@/shared/constants';

export class HistoryStorage {
    private readonly storage: LocalStorage;
    private readonly limit: number;

    constructor(storage: LocalStorage, limit: number) {
        this.storage = storage;
        this.limit = limit;
    }

    private getKey(domain: string): string {
        return `${constants.STORAGE_NAMESPACE}_history::${domain}`;
    }

    /**
     * Get previous questions for this domain
     */
    async getPreviousQuestions(domain: string): Promise<string[]> {
        const history = await this.storage.get<string[]>(this.getKey(domain));
        return history ?? [];
    }

    /**
     * Save question to history
     */
    async saveQuestion(domain: string, question: string): Promise<void> {
        const history = await this.getPreviousQuestions(domain);
        const updated = [question, ...history].slice(0, this.limit); // LIFO

        await this.storage.set(this.getKey(domain), updated);
    }
}
