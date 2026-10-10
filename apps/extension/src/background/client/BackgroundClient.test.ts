import type { AgentResultElement, PageTrailDto, QueryResponse } from '@flowforge/contract';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it, vi } from 'vitest';

import type { Message, MessageResponse } from '@/adapters';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { createSettingsFixture } from '../../../test/fixtures';
import { BackgroundClient } from './BackgroundClient';
import type { PageMessageCallbacks } from './contract';

const element: AgentResultElement = {
    text: 'Settings',
    dataId: 'flowforge-settings',
    cssSelector: '#settings',
    action: 'click',
};

const queryResponse: QueryResponse = {
    result: {
        answer: 'Open settings.',
        elements: [element],
        mode: 'direct',
        topic: 'Settings',
    },
    metadata: {
        model: 'test-model',
        execTimeMs: 10,
        usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    },
};

describe('BackgroundClient', () => {
    it('sends popup commands for the active page and unwraps their responses', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 42 });
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            if (message.type === 'GET_PREV_QUESTIONS') {
                return { success: true, data: { questions: ['Where is billing?'] } };
            }
            if (message.type === 'ASK_QUESTION') {
                return { success: true, data: queryResponse };
            }
            return { success: true };
        });
        const client = new BackgroundClient(transport);

        // When
        await client.initializePopup();
        const questions = await client.getPreviousQuestions();
        const answer = await client.askQuestion('How do I open settings?');
        await client.navigateToElement(element);
        await client.openPageInspector('interactive');

        // Then
        expect(questions).toEqual(['Where is billing?']);
        expect(answer).toEqual(queryResponse);
        expect(messages).toEqual([
            { type: 'POPUP_INITIALISE', pageId: 42 },
            { type: 'GET_PREV_QUESTIONS', pageId: 42 },
            { type: 'ASK_QUESTION', pageId: 42, data: { question: 'How do I open settings?' } },
            { type: 'NAVIGATE_TO_ELEMENT', pageId: 42, data: { element } },
            { type: 'OPEN_PAGE_INSPECTOR', pageId: 42, data: { tab: 'interactive' } },
        ]);
    });

    it('throws background response errors', async () => {
        // Given
        const transport = new FakeTransportService();
        transport.addMessageListener(() => ({ success: false, error: 'Background unavailable' }));
        const client = new BackgroundClient(transport);

        // When / Then
        await expect(client.askQuestion('How?')).rejects.toThrow('Background unavailable');
    });

    it('converts page command errors to failure responses', async () => {
        // Given
        const transport = new FakeTransportService();
        const client = new BackgroundClient(transport);
        client.subscribeToPageMessages({
            onCollectPageTrail: vi.fn(),
            onClearPage: () => {
                throw new Error('Page cleanup failed');
            },
            onStartOnboarding: vi.fn(),
            onHighlightElement: vi.fn(),
            onOpenInspector: vi.fn(),
        });

        // When
        const response = await transport.dispatchToBackground({ type: 'CLEAR_PAGE' });

        // Then
        expect(response).toEqual({ success: false, error: 'Page cleanup failed' });
    });

    it('loads, updates, and observes settings', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 42 });
        const initialSettings = createSettingsFixture();
        const updatedSettings = createSettingsFixture({ theme: 'dark' });
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            if (message.type === 'GET_SETTINGS') return { success: true, data: initialSettings };
            if (message.type === 'UPDATE_SETTINGS') return { success: true, data: updatedSettings };
            return undefined;
        });
        const client = new BackgroundClient(transport);
        const listener = vi.fn();
        client.subscribeToSettingsMessages({ onSettingsUpdated: listener });

        // When
        const loadedSettings = await client.getSettings();
        const savedSettings = await client.updateSettings({ theme: 'dark' });
        await transport.dispatchToBackground({ type: 'SETTINGS_UPDATED', data: updatedSettings });

        // Then
        expect(loadedSettings).toEqual(initialSettings);
        expect(savedSettings).toEqual(updatedSettings);
        expect(listener).toHaveBeenCalledWith(updatedSettings);
        expect(messages).toEqual([
            { type: 'GET_SETTINGS', pageId: 42 },
            { type: 'UPDATE_SETTINGS', pageId: 42, data: { patch: { theme: 'dark' } } },
            { type: 'SETTINGS_UPDATED', data: updatedSettings },
        ]);
    });

    it('routes page messages and stops after unsubscribe', async () => {
        // Given
        const transport = new FakeTransportService();
        const pageTrailDto = createPageTrailDtoFixture();
        const callbacks: PageMessageCallbacks = {
            onCollectPageTrail: vi.fn(() => pageTrailDto),
            onClearPage: vi.fn(),
            onStartOnboarding: vi.fn(),
            onHighlightElement: vi.fn(),
            onOpenInspector: vi.fn(),
        };
        const client = new BackgroundClient(transport);
        const unsubscribe = client.subscribeToPageMessages(callbacks);

        // When
        const collectionResponse = await transport.dispatchToBackground({ type: 'COLLECT_PAGE_TRAIL' });
        await transport.dispatchToBackground({ type: 'CLEAR_PAGE' });
        await transport.dispatchToBackground({
            type: 'START_ONBOARDING',
            data: {
                title: 'Settings',
                description: 'Open settings.',
                mode: 'direct',
                elements: [element],
            },
        });
        await transport.dispatchToBackground({ type: 'HIGHLIGHT_ELEMENT', data: { element } });
        await transport.dispatchToBackground({ type: 'OPEN_INSPECTOR', data: { tab: 'interactive' } });

        // Then
        expect((collectionResponse as MessageResponse<PageTrailDto> & { success: true }).data).toEqual(pageTrailDto);
        expect(callbacks.onClearPage).toHaveBeenCalledOnce();
        expect(callbacks.onStartOnboarding).toHaveBeenCalledWith({
            title: 'Settings',
            description: 'Open settings.',
            mode: 'direct',
            elements: [element],
        });
        expect(callbacks.onHighlightElement).toHaveBeenCalledWith(element);
        expect(callbacks.onOpenInspector).toHaveBeenCalledWith('interactive');

        // When
        unsubscribe();

        // Then
        await expect(transport.dispatchToBackground({ type: 'CLEAR_PAGE' })).rejects.toThrow(
            'Message handler is not registered',
        );
    });
});
