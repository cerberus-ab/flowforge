export type Message<D = undefined> = D extends undefined ? { type: string } : { type: string; data: D };

export interface MessageContext {
    pageId?: number;
}

export interface MessageEnvelope<M extends Message = Message> {
    message: M;
    context: MessageContext;
}

export type MessageResponse<D = undefined> =
    (D extends undefined ? { success: true } : { success: true; data: D }) | { success: false; error: string };

export type AnyMessageResponse = MessageResponse | MessageResponse<unknown>;

export type MessageListener = (
    message: Message,
    context: MessageContext,
) => Promise<AnyMessageResponse> | AnyMessageResponse | undefined;

export function requirePageId(context: MessageContext): number {
    const { pageId } = context;
    if (typeof pageId !== 'number' || !Number.isInteger(pageId) || pageId < 0) {
        throw new Error('Message requires a page context');
    }
    return pageId;
}
