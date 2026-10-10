export type Message<D = undefined> = D extends undefined ? { type: string } : { type: string; data: D };

export type PageScopedMessage<M extends Message = Message> = M & { pageId: number };

export type MessageResponse<D = undefined> =
    (D extends undefined ? { success: true } : { success: true; data: D }) | { success: false; error: string };

export type AnyMessageResponse = MessageResponse | MessageResponse<unknown>;

export type MessageListener = (message: Message) => Promise<AnyMessageResponse> | AnyMessageResponse | undefined;
