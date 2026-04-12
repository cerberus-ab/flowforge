import type { StorageService } from '#self/adapters/interface';

export class HistoryService {
    private readonly storage: StorageService;
    private readonly namespace: string;
    private readonly limit: number;

    constructor(
        storage: StorageService,
        options: {
            namespace?: string;
            limit?: number;
        } = {},
    ) {
        this.storage = storage;
        this.namespace = options.namespace ?? 'history';
        this.limit = options.limit ?? 10;
    }

    /**
     * Get previous questions for this domain
     */
    async getPreviousQuestions(domain: string): Promise<string[]> {
        try {
            const key = `${this.namespace}_${domain}`;
            const history = await this.storage.get<string[]>(key);

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
            const key = `${this.namespace}_${domain}`;
            const history = await this.getPreviousQuestions(domain);
            const updated = [question, ...history].slice(0, this.limit); // LIFO

            await this.storage.set(key, updated);
        } catch (error) {
            console.error('[Background] Error saving question:', error);
        }
    }
}
