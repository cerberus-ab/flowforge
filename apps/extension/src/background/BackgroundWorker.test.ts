import type { PageTrail } from '@flowforge/contract';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeApiClient, createQueryResponseFixture } from '../../test/unit/fakes/FakeApiClient';
import { FakeLocalStorage } from '../../test/unit/fakes/FakeLocalStorage';
import { FakeTransportService } from '../../test/unit/fakes/FakeTransportService';
import { createPageTrailFixture } from '../../test/fixtures.ts';
import { HistoryStorage } from '../core/services/HistoryStorage';
import { SettingsStorage } from '../core/services/SettingsStorage';
import type {
    AskQuestionMessage,
    ExtensionSettings,
    GetPrevQuestionsMessage,
    NavigateToElementMessage,
    OpenPageInspectorMessage,
    PopupInitializeMessage,
    UpdateSettingsMessage,
} from '@/types';
import { BackgroundWorker } from './BackgroundWorker';

describe('BackgroundWorker', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    it('registers and unregisters its message listener', async () => {
        const transport = createTransport();
        const worker = createWorker(transport);

        worker.start();

        await expect(transport.dispatchToBackground({ type: 'GET_SETTINGS' })).resolves.toEqual({
            success: true,
            data: defaultSettings,
        });

        worker.stop();

        await expect(transport.dispatchToBackground({ type: 'GET_SETTINGS' })).rejects.toThrow(
            'Message handler is not registered',
        );
    });

    it('returns and updates settings', async () => {
        const transport = createTransport();
        const worker = createWorker(transport);

        worker.start();

        await expect(transport.dispatchToBackground({ type: 'GET_SETTINGS' })).resolves.toEqual({
            success: true,
            data: defaultSettings,
        });

        await expect(
            transport.dispatchToBackground({
                type: 'UPDATE_SETTINGS',
                senderId: 7,
                data: { patch: { theme: 'dark' } },
            } satisfies UpdateSettingsMessage),
        ).resolves.toEqual({
            success: true,
            data: { ...defaultSettings, theme: 'dark' },
        });

        expect(transport.getSentToPage()).toContainEqual({
            senderId: 7,
            message: {
                type: 'SETTINGS_UPDATED',
                data: { ...defaultSettings, theme: 'dark' },
            },
        });

        worker.stop();
    });

    it('clears page state when the popup initializes', async () => {
        const transport = createTransport();
        const worker = createWorker(transport);

        worker.start();

        await expect(
            transport.dispatchToBackground({
                type: 'POPUP_INITIALISE',
                senderId: 7,
            } satisfies PopupInitializeMessage),
        ).resolves.toEqual({
            success: true,
        });

        expect(transport.getSentToPage()).toContainEqual({
            senderId: 7,
            message: { type: 'CLEAR_PAGE' },
        });

        worker.stop();
    });

    it('answers a question through page collection, API query, onboarding, and history', async () => {
        const element = {
            text: 'Save',
            dataId: 'save-button',
            cssSelector: '#save',
            action: 'click',
        } as const;
        const response = createQueryResponseFixture({
            result: {
                answer: 'Click Save.',
                elements: [element],
                mode: 'steps',
                topic: 'Saving',
            },
        });
        const pageTrail = createPageTrailFixture({
            basics: {
                url: 'https://app.flowforge.test/settings',
                title: 'Settings page',
                description: 'Application settings',
                language: 'en',
                viewport: {
                    width: 1440,
                    height: 900,
                    scrollY: 120,
                    scrollHeight: 1800,
                },
            },
        });
        const apiClient = new FakeApiClient(response);
        const localStorage = new FakeLocalStorage();
        const historyStorage = new HistoryStorage(localStorage, 5);
        await historyStorage.saveQuestion('app.flowforge.test', 'Previous question');
        const transport = createTransport({
            hostname: 'app.flowforge.test',
            pageTrail,
        });
        const worker = createWorker(transport, { apiClient, historyStorage });

        worker.start();

        await expect(
            transport.dispatchToBackground({
                type: 'ASK_QUESTION',
                senderId: 7,
                data: { question: 'How do I save?' },
            } satisfies AskQuestionMessage),
        ).resolves.toEqual({ success: true, data: response });

        expect(transport.getSentToPage()).toEqual([
            { senderId: 7, message: { type: 'CLEAR_PAGE' } },
            { senderId: 7, message: { type: 'COLLECT_PAGE_TRAIL' } },
            {
                senderId: 7,
                message: {
                    type: 'START_ONBOARDING',
                    data: {
                        title: 'Saving',
                        description: 'Click Save.',
                        elements: [element],
                        mode: 'steps',
                    },
                },
            },
        ]);
        expect(apiClient.requests).toEqual([
            {
                question: 'How do I save?',
                pageTrail,
                domain: 'app.flowforge.test',
                userContext: {
                    previousQuestions: ['Previous question'],
                },
            },
        ]);
        await expect(historyStorage.getPreviousQuestions('app.flowforge.test')).resolves.toEqual([
            'How do I save?',
            'Previous question',
        ]);

        worker.stop();
    });

    it('returns previous questions for the sender hostname', async () => {
        const historyStorage = new HistoryStorage(new FakeLocalStorage(), 5);
        await historyStorage.saveQuestion('app.flowforge.test', 'How do I save?');
        const transport = createTransport({ hostname: 'app.flowforge.test' });
        const worker = createWorker(transport, { historyStorage });

        worker.start();

        await expect(
            transport.dispatchToBackground({
                type: 'GET_PREV_QUESTIONS',
                senderId: 7,
            } satisfies GetPrevQuestionsMessage),
        ).resolves.toEqual({
            success: true,
            data: { questions: ['How do I save?'] },
        });

        worker.stop();
    });

    it('navigates to elements and opens the inspector through page messages', async () => {
        const transport = createTransport();
        const worker = createWorker(transport);
        const element = {
            text: 'Save',
            dataId: 'save-button',
            cssSelector: '#save',
            action: 'click',
        } as const;

        worker.start();

        await expect(
            transport.dispatchToBackground({
                type: 'NAVIGATE_TO_ELEMENT',
                senderId: 7,
                data: { element },
            } satisfies NavigateToElementMessage),
        ).resolves.toEqual({ success: true });

        await expect(
            transport.dispatchToBackground({
                type: 'OPEN_PAGE_INSPECTOR',
                senderId: 7,
                data: { tab: 'semantic' },
            } satisfies OpenPageInspectorMessage),
        ).resolves.toEqual({ success: true });

        expect(transport.getSentToPage()).toEqual([
            { senderId: 7, message: { type: 'CLEAR_PAGE' } },
            {
                senderId: 7,
                message: {
                    type: 'HIGHLIGHT_ELEMENT',
                    data: { element },
                },
            },
            { senderId: 7, message: { type: 'CLEAR_PAGE' } },
            {
                senderId: 7,
                message: {
                    type: 'OPEN_INSPECTOR',
                    data: { tab: 'semantic' },
                },
            },
        ]);

        worker.stop();
    });
});

const defaultSettings: ExtensionSettings = {
    theme: 'light',
    devMode: false,
};

function createWorker(
    transport: FakeTransportService,
    {
        apiClient = new FakeApiClient(),
        historyStorage = new HistoryStorage(new FakeLocalStorage(), 5),
        settingsStorage = new SettingsStorage(new FakeLocalStorage(), defaultSettings),
    }: {
        apiClient?: FakeApiClient;
        historyStorage?: HistoryStorage;
        settingsStorage?: SettingsStorage;
    } = {},
) {
    return new BackgroundWorker(transport, apiClient, historyStorage, settingsStorage);
}

function createTransport({
    hostname = 'localhost',
    pageTrail = createPageTrailFixture(),
}: {
    hostname?: string;
    pageTrail?: PageTrail;
} = {}) {
    const transport = new FakeTransportService({
        activeSenderId: 7,
        senderHostname: hostname,
    });
    transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: pageTrail });
    return transport;
}
