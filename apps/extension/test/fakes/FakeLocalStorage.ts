import type { LocalStorage } from '@/adapters/interface';

export class FakeLocalStorage implements LocalStorage {
    private readonly values = new Map<string, unknown>();

    async get<T>(key: string): Promise<T | null> {
        return this.values.has(key) ? (this.values.get(key) as T) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        this.values.set(key, value);
    }

    async clear(): Promise<void> {
        this.values.clear();
    }
}
