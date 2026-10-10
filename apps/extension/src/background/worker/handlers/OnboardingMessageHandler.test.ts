import { describe, expect, it } from 'vitest';

import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { PageClient } from '@/page/client/PageClient';
import type { OpenOnboardingMessage } from '@/messaging';
import { OnboardingMessageHandler } from './OnboardingMessageHandler';

describe('OnboardingMessageHandler', () => {
    it('forwards the onboarding data to the sender page', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new OnboardingMessageHandler(new PageClient(transport));
        const message: OpenOnboardingMessage = {
            type: 'OPEN_ONBOARDING',
            data: {
                question: 'How do I save?',
                result: {
                    answer: 'Click Save.',
                    mode: 'steps',
                    topic: 'Saving',
                    elements: [{ text: 'Save', dataId: 'save-button', cssSelector: '#save', action: 'click' }],
                },
            },
        };

        // When
        await handler.handleOpenOnboarding(message, { pageId: 7 });

        // Then
        expect(transport.getSentToPage()).toEqual([
            {
                pageId: 7,
                message: {
                    type: 'START_ONBOARDING',
                    data: {
                        title: 'Saving',
                        description: 'Click Save.',
                        mode: 'steps',
                        elements: message.data.result.elements,
                    },
                },
            },
        ]);
    });

    it('rejects a message without a page context', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new OnboardingMessageHandler(new PageClient(transport));
        const message: OpenOnboardingMessage = {
            type: 'OPEN_ONBOARDING',
            data: {
                question: 'How do I save?',
                result: { answer: 'Click Save.', mode: 'steps', topic: null, elements: [] },
            },
        };

        // When / Then
        await expect(handler.handleOpenOnboarding(message, {})).rejects.toThrow('Message requires a page context');
        expect(transport.getSentToPage()).toEqual([]);
    });
});
