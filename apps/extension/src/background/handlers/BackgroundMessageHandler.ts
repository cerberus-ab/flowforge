import type { Message, Response } from '@/adapters';

export interface BackgroundMessageHandler {
    handle(message: Message): Promise<Response> | Response | undefined;
}
