import type { LocalStorage } from '../interface';

export class EmbedLocalStorage implements LocalStorage {
    async get<T>(key: string): Promise<T | null> {
        const value = window.localStorage.getItem(key);
        return value ? (JSON.parse(value) as T) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    async clear(): Promise<void> {
        window.localStorage.clear();
    }
}
