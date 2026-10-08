export interface LocalStorage {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    clear(): Promise<void>;
}
