import type { Message, MessageResponse } from '@/adapters';

export interface BackgroundMessageHandler {
    handle(message: Message): Promise<MessageResponse> | MessageResponse | undefined;
}
