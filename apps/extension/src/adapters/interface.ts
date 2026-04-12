import type { Message, MessageResponse } from '#self/types';

export interface StorageService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    clear(): Promise<void>;
}

export interface TransportService {
    /**
     * Returns identifier of the current active sender (e.g., active tab).
     */
    getActiveSenderId(): Promise<number>;

    /**
     * Resolves hostname for given sender.
     */
    getSenderHostname(senderId: number): Promise<string>;

    /**
     * Sends a message to the background and returns a typed response.
     */
    sendToBackground<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        message: TMessage,
    ): Promise<TResponse>;

    /**
     * Sends a message to a specific page context (e.g., tab) by senderId.
     */
    sendToPage<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        senderId: number,
        message: TMessage,
    ): Promise<TResponse>;

    /**
     * Adds a listener for incoming messages. Returns a function to remove the listener.
     */
    addMessageListener(
        handler: (message: Message) => Promise<MessageResponse> | MessageResponse | undefined,
    ): () => void;
}
