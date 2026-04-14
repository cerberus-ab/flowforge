import type { LocalStorage } from '#self/adapters/interface';
import { constants } from '#self/constants';

export class HistoryStorage {
    private readonly storage: LocalStorage;
    private readonly limit: number;

    constructor(storage: LocalStorage, limit: number) {
        this.storage = storage;
        this.limit = limit;
    }

    private getKey(domain: string) {
        return `${constants.LOCAL_STORAGE_NAMESPACE}_history_${domain}`;
    }

    /**
     * Get previous questions for this domain
     */
    async getPreviousQuestions(domain: string): Promise<string[]> {
        try {
            const history = await this.storage.get<string[]>(this.getKey(domain));

            return history ?? [];
        } catch (error) {
            console.error('[Background] Error getting previous questions:', error);
            return [];
        }
    }

    /**
     * Save question to history
     */
    async saveQuestion(domain: string, question: string): Promise<void> {
        try {
            const history = await this.getPreviousQuestions(domain);
            const updated = [question, ...history].slice(0, this.limit); // LIFO

            await this.storage.set(this.getKey(domain), updated);
        } catch (error) {
            console.error('[Background] Error saving question:', error);
        }
    }
}
