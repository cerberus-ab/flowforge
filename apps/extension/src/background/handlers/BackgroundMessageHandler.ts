import type { Message, MessageResponse } from '@/types';

export interface BackgroundMessageHandler {
    handle(message: Message): Promise<MessageResponse> | MessageResponse | undefined;
}
