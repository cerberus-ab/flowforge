import { describe, expect, it } from 'vitest';

import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { PageClient } from '@/page/client/PageClient';
import type { NavigateToElementMessage, OpenOnboardingMessage } from '@/messaging';
import { PageActionMessageHandler } from './PageActionMessageHandler';

describe('PageActionMessageHandler', () => {
    it('clears the page before highlighting a requested element', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new PageActionMessageHandler(new PageClient(transport));
        const message: NavigateToElementMessage = {
            type: 'NAVIGATE_TO_ELEMENT',
            data: { element: { dataId: 'submit', text: 'Submit', action: 'click', cssSelector: '#submit' } },
        };

        // When
        await handler.handleNavigateToElement(message, { pageId: 7 });

        // Then
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            { pageId: 7, message: { type: 'HIGHLIGHT_ELEMENT', data: { element: message.data.element } } },
        ]);
    });

    it('opens onboarding using the question and response data', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new PageActionMessageHandler(new PageClient(transport));
        const message: OpenOnboardingMessage = {
            type: 'OPEN_ONBOARDING',
            data: {
                question: 'How do I submit?',
                result: {
                    topic: 'Submit the form',
                    answer: 'Complete these steps.',
                    mode: 'steps',
                    elements: [],
                },
            },
        };

        // When
        await handler.handleOpenOnboarding(message, { pageId: 7 });

        // Then
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            {
                pageId: 7,
                message: {
                    type: 'START_ONBOARDING',
                    data: {
                        title: 'Submit the form',
                        description: 'Complete these steps.',
                        mode: 'steps',
                        elements: [],
                    },
                },
            },
        ]);
    });
});
