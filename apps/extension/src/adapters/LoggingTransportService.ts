import type { TransportService } from './TransportService';
import type {
    BackgroundMessage,
    BackgroundMessageResponse,
    Message,
    MessageContext,
    MessageListener,
    PageMessage,
    PageMessageResponse,
    PopupMessage,
} from '@/messaging';

/** Adds development-only diagnostics around transport messages. */
export class LoggingTransportService implements TransportService {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    getActivePageContext(): Promise<MessageContext> {
        return this.transport.getActivePageContext();
    }

    getPageUrl(pageId: number): Promise<string> {
        return this.transport.getPageUrl(pageId);
    }

    async sendToBackground<M extends BackgroundMessage>(
        message: M,
        context: MessageContext,
    ): Promise<BackgroundMessageResponse<M>> {
        return this.logOutgoing('background', message, context, () =>
            this.transport.sendToBackground(message, context),
        );
    }

    async sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>> {
        return this.logOutgoing('page', message, { pageId }, () => this.transport.sendToPage(pageId, message));
    }

    async sendToPopup(pageId: number, message: PopupMessage): Promise<void> {
        return this.logOutgoing('popup', message, { pageId }, () => this.transport.sendToPopup(pageId, message));
    }

    addMessageListener(handler: MessageListener): () => void {
        return this.transport.addMessageListener((message, context) => {
            this.log('received', message, context);
            try {
                const response = handler(message, context);
                if (response === undefined) return undefined;
                return Promise.resolve(response).then(
                    (value) => {
                        this.log('responded', message, context, value);
                        return value;
                    },
                    (error: unknown) => {
                        this.log('failed', message, context, error);
                        throw error;
                    },
                );
            } catch (error) {
                this.log('failed', message, context, error);
                throw error;
            }
        });
    }

    private async logOutgoing<T>(
        destination: 'background' | 'page' | 'popup',
        message: Message,
        context: MessageContext,
        send: () => Promise<T>,
    ): Promise<T> {
        this.log(`sent to ${destination}`, message, context);
        try {
            const response = await send();
            this.log(`response from ${destination}`, message, context, response);
            return response;
        } catch (error) {
            this.log(`failed to reach ${destination}`, message, context, error);
            throw error;
        }
    }

    private log(event: string, message: Message, context: MessageContext, details?: unknown): void {
        console.log(`[FlowForge transport] ${event}: ${message.type}`, { context, message, details });
    }
}

/** Wraps a transport with message logging in Vite development builds only. */
export function withTransportLogging(transport: TransportService): TransportService {
    return import.meta.env.MODE === 'development' ? new LoggingTransportService(transport) : transport;
}
