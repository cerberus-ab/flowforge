import { describe, expect, it } from 'vitest';

import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { PageClient } from '@/page/client/PageClient';
import type { NavigateToElementMessage } from '@/messaging';
import { ElementNavigationMessageHandler } from './ElementNavigationMessageHandler';

describe('ElementNavigationMessageHandler', () => {
    it('clears the page before navigating to an element', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new ElementNavigationMessageHandler(new PageClient(transport));
        const element = {
            text: 'Save',
            dataId: 'save-button',
            cssSelector: '#save',
            action: 'click',
        } as const;
        const message: NavigateToElementMessage = {
            type: 'NAVIGATE_TO_ELEMENT',
            data: { element },
        };

        // When
        const response = await handler.handleNavigateToElement(message, { pageId: 7 });

        // Then
        expect(response).toBeUndefined();
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            { pageId: 7, message: { type: 'HIGHLIGHT_ELEMENT', data: { element } } },
        ]);
    });

    it('rejects a message without a page context', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new ElementNavigationMessageHandler(new PageClient(transport));
        const message: NavigateToElementMessage = {
            type: 'NAVIGATE_TO_ELEMENT',
            data: {
                element: {
                    text: 'Save',
                    dataId: 'save-button',
                    cssSelector: '#save',
                    action: 'click',
                },
            },
        };

        // When / Then
        await expect(handler.handleNavigateToElement(message, {})).rejects.toThrow('Message requires a page context');
        expect(transport.getSentToPage()).toEqual([]);
    });
});
