import type { AnyMessageResponse, Message, MessageResponse } from './Message';

type MessageErrorHandler = (message: Message, error: unknown) => void;

export interface MessageRoute {
    resolve(message: Message): (() => unknown | Promise<unknown>) | undefined;
}

export class MessageRouter {
    private readonly routes: readonly MessageRoute[];
    private readonly onError?: MessageErrorHandler;

    constructor(routes: readonly MessageRoute[], onError?: MessageErrorHandler) {
        this.routes = routes;
        this.onError = onError;
    }

    static route<M extends Message>(
        isMessage: (message: Message) => message is M,
        handle: (message: M) => unknown | Promise<unknown>,
    ): MessageRoute {
        return {
            resolve: (message) => {
                if (!isMessage(message)) return undefined;
                return () => handle(message);
            },
        };
    }

    readonly handle = (message: Message): Promise<AnyMessageResponse> | undefined => {
        let operation: (() => unknown | Promise<unknown>) | undefined;

        try {
            for (const route of this.routes) {
                operation = route.resolve(message);
                if (operation) break;
            }
        } catch (error) {
            return Promise.resolve(this.createErrorResponse(message, error));
        }
        if (!operation) return undefined;

        return Promise.resolve()
            .then(operation)
            .then((data): AnyMessageResponse => (data === undefined ? { success: true } : { success: true, data }))
            .catch((error: unknown) => this.createErrorResponse(message, error));
    };

    private createErrorResponse(message: Message, error: unknown): MessageResponse {
        this.onError?.(message, error);

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
