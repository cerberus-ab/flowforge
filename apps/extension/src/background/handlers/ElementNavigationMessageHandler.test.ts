import { describe, expect, it } from 'vitest';

import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import type { NavigateToElementMessage } from '@/types';
import { ElementNavigationMessageHandler } from './ElementNavigationMessageHandler';

describe('ElementNavigationMessageHandler', () => {
    it('clears the page before navigating to an element', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new ElementNavigationMessageHandler(transport);
        const element = {
            text: 'Save',
            dataId: 'save-button',
            cssSelector: '#save',
            action: 'click',
        } as const;
        const message: NavigateToElementMessage = {
            type: 'NAVIGATE_TO_ELEMENT',
            pageId: 7,
            data: { element },
        };

        // When
        const response = await handler.handle(message);

        // Then
        expect(response).toEqual({ success: true });
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            { pageId: 7, message: { type: 'HIGHLIGHT_ELEMENT', data: { element } } },
        ]);
    });
});
