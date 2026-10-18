import type { AgentResultElement, PageTrailDto, QueryResponse } from '@flowforge/contract';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it, vi } from 'vitest';

import type { Message, MessageResponse, RestoreQueryResponse } from '@/messaging';
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

const restoreQueryResponse: RestoreQueryResponse = {
    status: 'pending',
    queryId: 'query-1',
    data: { question: 'How do I open settings?' },
};

describe('BackgroundClient', () => {
    it('requests an Inspector snapshot for the specified page, not the active page', async () => {
        // Given
        const snapshot = createPageTrailDtoFixture();
        const transport = new FakeTransportService({ activePageId: 7 });
        const contexts: unknown[] = [];
        transport.addMessageListener((message, context) => {
            if (message.type !== 'GET_PAGE_INSPECTOR_DATA') return undefined;
            contexts.push(context);
            return { success: true, data: snapshot };
        });
        const client = new BackgroundClient(transport);

        // When
        const result = await client.getPageInspectorData(42);

        // Then
        expect(result).toEqual(snapshot);
        expect(contexts).toEqual([{ pageId: 42 }]);
    });

    it('sends popup commands for the active page and unwraps their responses', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 42 });
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            if (message.type === 'GET_PREV_QUESTIONS') {
                return { success: true, data: { questions: ['Where is billing?'] } };
            }
            if (message.type === 'RESTORE_QUERY') {
                return { success: true, data: restoreQueryResponse };
            }
            if (message.type === 'ASK_QUESTION') {
                return { success: true, data: { queryId: 'query-1' } };
            }
            if (message.type === 'CLEAR_QUERY') {
                return { success: true, data: true };
            }
            return { success: true };
        });
        const client = new BackgroundClient(transport);

        // When
        await client.notifyPopupOpened();
        const restoredQuery = await client.restoreQuery();
        const questions = await client.getPreviousQuestions();
        const answer = await client.askQuestion('How do I open settings?');
        const cleared = await client.clearQuery('query-1');
        await client.navigateToElement(element);
        await client.openPageInspector('interactive');
        await client.openOnboarding('How do I open settings?', queryResponse.result);

        // Then
        expect(questions).toEqual({ questions: ['Where is billing?'] });
        expect(restoredQuery).toEqual(restoreQueryResponse);
        expect(answer).toEqual({ queryId: 'query-1' });
        expect(cleared).toBe(true);
        expect(messages).toEqual([
            { type: 'POPUP_OPENED' },
            { type: 'RESTORE_QUERY' },
            { type: 'GET_PREV_QUESTIONS' },
            { type: 'ASK_QUESTION', data: { question: 'How do I open settings?' } },
            { type: 'CLEAR_QUERY', data: { queryId: 'query-1' } },
            { type: 'NAVIGATE_TO_ELEMENT', data: { element } },
            { type: 'OPEN_PAGE_INSPECTOR', data: { tab: 'interactive' } },
            {
                type: 'OPEN_ONBOARDING',
                data: { question: 'How do I open settings?', result: queryResponse.result },
            },
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

    it('observes query completions only for the active page', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 42 });
        const listener = vi.fn();
        const client = new BackgroundClient(transport);
        client.subscribeToPopupMessages({ onQueryFinished: listener });
        const message = { type: 'QUERY_FINISHED', data: { queryId: 'query-1' } } as const;

        // When
        await transport.sendToPopup(message, { pageId: 7 });

        // Then
        expect(listener).not.toHaveBeenCalled();

        // When
        await transport.sendToPopup(message, { pageId: 42 });

        // Then
        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith({ queryId: 'query-1' });
    });

    it('converts page command errors to failure responses', async () => {
        // Given
        const transport = new FakeTransportService();
        const client = new BackgroundClient(transport);
        client.subscribeToPageMessages({
            onCollectPageTrail: vi.fn(),
            onCollectPageTrailContextOnly: vi.fn(),
            onContainsElements: vi.fn(),
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
            { type: 'GET_SETTINGS' },
            { type: 'UPDATE_SETTINGS', data: { patch: { theme: 'dark' } } },
            { type: 'SETTINGS_UPDATED', data: updatedSettings },
        ]);
    });

    it('routes page messages and stops after unsubscribe', async () => {
        // Given
        const transport = new FakeTransportService();
        const pageTrailDto = createPageTrailDtoFixture();
        const callbacks: PageMessageCallbacks = {
            onCollectPageTrail: vi.fn(() => pageTrailDto),
            onCollectPageTrailContextOnly: vi.fn(() => pageTrailDto),
            onContainsElements: vi.fn(() => true),
            onClearPage: vi.fn(),
            onStartOnboarding: vi.fn(),
            onHighlightElement: vi.fn(),
            onOpenInspector: vi.fn(),
        };
        const client = new BackgroundClient(transport);
        const unsubscribe = client.subscribeToPageMessages(callbacks);

        // When
        const collectionResponse = await transport.dispatchToBackground({
            type: 'COLLECT_PAGE_TRAIL',
            data: { contextOnly: false },
        });
        const contextOnlyResponse = await transport.dispatchToBackground({
            type: 'COLLECT_PAGE_TRAIL',
            data: { contextOnly: true },
        });
        const containsResponse = await transport.dispatchToBackground({
            type: 'CONTAINS_ELEMENTS',
            data: { dataIds: [element.dataId] },
        });
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
        expect(contextOnlyResponse).toEqual({ success: true, data: pageTrailDto });
        expect(callbacks.onCollectPageTrail).toHaveBeenCalledOnce();
        expect(callbacks.onCollectPageTrailContextOnly).toHaveBeenCalledOnce();
        expect(containsResponse).toEqual({
            success: true,
            data: true,
        });
        expect(callbacks.onContainsElements).toHaveBeenCalledWith({ dataIds: [element.dataId] });
        expect(callbacks.onClearPage).toHaveBeenCalledOnce();
        expect(callbacks.onStartOnboarding).toHaveBeenCalledWith({
            title: 'Settings',
            description: 'Open settings.',
            mode: 'direct',
            elements: [element],
        });
        expect(callbacks.onHighlightElement).toHaveBeenCalledWith({ element });
        expect(callbacks.onOpenInspector).toHaveBeenCalledWith({ tab: 'interactive' });

        // When
        unsubscribe();

        // Then
        await expect(transport.dispatchToBackground({ type: 'CLEAR_PAGE' })).rejects.toThrow(
            'Message handler is not registered',
        );
    });
});
