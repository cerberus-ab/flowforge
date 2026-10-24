import type { TransportService } from './TransportService';
import type {
    BackgroundMessage,
    BackgroundMessageResponse,
    MessageContext,
    MessageListener,
    PageMessage,
    PageMessageResponse,
    PopupMessage,
    PopupMessageResponse,
    SidePanelMessage,
    SidePanelMessageResponse,
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

    async sendToPopup<M extends PopupMessage>(message: M, context: MessageContext): Promise<PopupMessageResponse<M>> {
        return this.logOutgoing('popup', message, context, () => this.transport.sendToPopup(message, context));
    }

    async sendToSidePanel<M extends SidePanelMessage>(
        message: M,
        context: MessageContext,
    ): Promise<SidePanelMessageResponse<M>> {
        return this.logOutgoing('side panel', message, context, () => this.transport.sendToSidePanel(message, context));
    }

    addMessageListener(handler: MessageListener): () => void {
        return this.transport.addMessageListener((message, context) => {
            const response = handler(message, context);
            if (response !== undefined) this.log('received', message.type, { context, message });
            return response;
        });
    }

    private async logOutgoing<T>(
        destination: 'background' | 'page' | 'popup' | 'side panel',
        message: Parameters<MessageListener>[0],
        context: MessageContext,
        send: () => Promise<T>,
    ): Promise<T> {
        this.log(`sent to ${destination}`, message.type, { context, message });
        try {
            const response = await send();
            this.log(`response from ${destination}`, message.type, { context, response });
            return response;
        } catch (error) {
            this.warn(`failed to send to ${destination}`, message.type, { context, error });
            throw error;
        }
    }

    private log(event: string, messageType: string, details: Record<string, unknown>): void {
        console.log(`[FlowForge transport] ${event}: ${messageType}`, details);
    }

    private warn(event: string, messageType: string, details: Record<string, unknown>): void {
        console.warn(`[FlowForge transport] ${event}: ${messageType}`, details);
    }
}

/** Wraps a transport with message logging in Vite development builds only. */
export function withTransportLogging(transport: TransportService): TransportService {
    return import.meta.env.MODE === 'development' ? new LoggingTransportService(transport) : transport;
}
