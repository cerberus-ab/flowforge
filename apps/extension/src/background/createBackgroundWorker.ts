import type { ApiClient } from '@/core/services/ApiClient';
import type { ExtensionSettings } from '@/types';
import type { LocalStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import {
    isAskQuestionMessage,
    isGetPrevQuestionsMessage,
    isGetSettingsMessage,
    isNavigateToElementMessage,
    isOpenPageInspectorMessage,
    isPopupInitializeMessage,
    isUpdateSettingsMessage,
} from '@/types';

import { BackgroundWorker } from './BackgroundWorker';
import { ElementNavigationMessageHandler } from './handlers/ElementNavigationMessageHandler';
import { PageInspectorMessageHandler } from './handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from './handlers/PopupLifecycleMessageHandler';
import { QuestionMessageHandler } from './handlers/QuestionMessageHandler';
import { SettingsMessageHandler } from './handlers/SettingsMessageHandler';
import { MessageRouter } from './MessageRouter';

interface AssistantBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: LocalStorage;
    apiClient: ApiClient;
    initialSettings?: Partial<ExtensionSettings>;
}

export function createBackgroundWorker({
    transport,
    localStorage,
    apiClient,
    initialSettings = {},
}: AssistantBackgroundWorkerOptions): BackgroundWorker {
    const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings, initialSettings);
    const popupLifecycleHandler = new PopupLifecycleMessageHandler(transport);
    const settingsHandler = new SettingsMessageHandler(transport, settingsStorage);
    const pageInspectorHandler = new PageInspectorMessageHandler(transport);
    const questionHandler = new QuestionMessageHandler(transport, apiClient, historyStorage);
    const elementNavigationHandler = new ElementNavigationMessageHandler(transport);

    return new BackgroundWorker(transport, [
        MessageRouter.route(isPopupInitializeMessage, (message) => popupLifecycleHandler.handle(message)),
        MessageRouter.route(isGetSettingsMessage, () => settingsHandler.handleGetSettings()),
        MessageRouter.route(isUpdateSettingsMessage, (message) => settingsHandler.handleUpdateSettings(message)),
        MessageRouter.route(isOpenPageInspectorMessage, (message) => pageInspectorHandler.handle(message)),
        MessageRouter.route(isAskQuestionMessage, (message) => questionHandler.handleAskQuestion(message)),
        MessageRouter.route(isGetPrevQuestionsMessage, (message) => questionHandler.handleGetPrevQuestions(message)),
        MessageRouter.route(isNavigateToElementMessage, (message) => elementNavigationHandler.handle(message)),
    ]);
}
