import type { SessionStorage } from '@/adapters';

export class EmbedSessionStorage implements SessionStorage {
    async get<T>(key: string): Promise<T | null> {
        const value = window.sessionStorage.getItem(key);
        return value ? (JSON.parse(value) as T) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    }

    async remove(key: string): Promise<void> {
        window.sessionStorage.removeItem(key);
    }

    async clear(): Promise<void> {
        window.sessionStorage.clear();
    }
}
