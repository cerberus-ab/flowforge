export interface Storage {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    clear(): Promise<void>;
}

export interface LocalStorage extends Storage {} // eslint-disable-line @typescript-eslint/no-empty-object-type

export interface SessionStorage extends Storage {} // eslint-disable-line @typescript-eslint/no-empty-object-type
