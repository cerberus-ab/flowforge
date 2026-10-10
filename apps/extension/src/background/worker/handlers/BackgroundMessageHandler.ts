import type { MessageRoute } from '@/messaging';

export interface BackgroundMessageHandler {
    routes(): readonly MessageRoute[];
}
