import type { SessionStorage } from '@/adapters';

export class ChromeSessionStorage implements SessionStorage {
    async get<T>(key: string): Promise<T | null> {
        const result = await chrome.storage.session.get(key);
        return (result[key] as T) ?? null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await chrome.storage.session.set({ [key]: value });
    }

    async clear(): Promise<void> {
        await chrome.storage.session.clear();
    }
}
