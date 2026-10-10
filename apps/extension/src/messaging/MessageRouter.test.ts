import { describe, expect, it, vi } from 'vitest';

import type { Message, MessageContext } from './Message';
import { MessageRouter } from './MessageRouter';

describe('MessageRouter', () => {
    const message: Message = { type: 'GET_SETTINGS' };
    const context: MessageContext = { pageId: 42 };
    const isAnyMessage = (candidate: Message): candidate is Message => Boolean(candidate);

    it('handles a message with the first matching route', async () => {
        // Given
        const handler = vi.fn(() => ({ theme: 'dark' }));
        const skippedHandler = vi.fn();
        const router = new MessageRouter([
            MessageRouter.route(
                (candidate): candidate is Message & { type: 'OTHER' } => candidate.type === 'OTHER',
                skippedHandler,
            ),
            MessageRouter.route(
                (candidate): candidate is Message & { type: 'GET_SETTINGS' } => candidate.type === 'GET_SETTINGS',
                handler,
            ),
            MessageRouter.route(isAnyMessage, vi.fn()),
        ]);

        // When
        const response = await router.handle(message, context);

        // Then
        expect(response).toEqual({ success: true, data: { theme: 'dark' } });
        expect(handler).toHaveBeenCalledWith(message, context);
        expect(skippedHandler).not.toHaveBeenCalled();
    });

    it('returns undefined when no route matches', () => {
        // Given
        const router = new MessageRouter([
            MessageRouter.route(
                (candidate): candidate is Message & { type: 'OTHER' } => candidate.type === 'OTHER',
                vi.fn(),
            ),
        ]);

        // When / Then
        expect(router.handle(message, context)).toBeUndefined();
    });

    it('returns a success response without data when the handler returns undefined', async () => {
        // Given
        const router = new MessageRouter([MessageRouter.route(isAnyMessage, () => undefined)]);

        // When
        const response = await router.handle(message, context);

        // Then
        expect(response).toEqual({ success: true });
    });

    it('converts route-resolution errors to failure responses and reports them', async () => {
        // Given
        const error = new Error('Route resolution failed');
        const onError = vi.fn();
        const router = new MessageRouter(
            [
                {
                    resolve: () => {
                        throw error;
                    },
                },
            ],
            onError,
        );

        // When
        const response = await router.handle(message, context);

        // Then
        expect(response).toEqual({ success: false, error: 'Route resolution failed' });
        expect(onError).toHaveBeenCalledWith(message, context, error);
    });

    it('converts handler errors to failure responses and reports them', async () => {
        // Given
        const error = new Error('Handler failed');
        const onError = vi.fn();
        const router = new MessageRouter([MessageRouter.route(isAnyMessage, () => Promise.reject(error))], onError);

        // When
        const response = await router.handle(message, context);

        // Then
        expect(response).toEqual({ success: false, error: 'Handler failed' });
        expect(onError).toHaveBeenCalledWith(message, context, error);
    });

    it('stringifies non-Error failures', async () => {
        // Given
        const router = new MessageRouter([MessageRouter.route(isAnyMessage, () => Promise.reject('network failure'))]);

        // When
        const response = await router.handle(message, context);

        // Then
        expect(response).toEqual({ success: false, error: 'network failure' });
    });
});
