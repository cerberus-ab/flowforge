import type { LocalStorage } from '@/adapters';

export class ChromeLocalStorage implements LocalStorage {
    async get<T>(key: string): Promise<T | null> {
        const result = await chrome.storage.local.get(key);
        return (result[key] as T) ?? null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await chrome.storage.local.set({ [key]: value });
    }

    async remove(key: string): Promise<void> {
        await chrome.storage.local.remove(key);
    }

    async clear(): Promise<void> {
        await chrome.storage.local.clear();
    }
}
