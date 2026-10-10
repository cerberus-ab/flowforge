import type { ApiClient } from '@/core/services/ApiClient';
import type { ExtensionSettings } from '@/types';
import type { LocalStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import {
    isAskQuestionMessage,
    isGetPrevQuestionsMessage,
    isGetSettingsMessage,
    isNavigateToElementMessage,
    isOpenPageInspectorMessage,
    isPopupInitializeMessage,
    isUpdateSettingsMessage,
} from '@/types';

import { BackgroundWorker } from '../BackgroundWorker';
import { ElementNavigationMessageHandler } from '@/background/worker/handlers/ElementNavigationMessageHandler';
import { PageInspectorMessageHandler } from '@/background/worker/handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '@/background/worker/handlers/PopupLifecycleMessageHandler';
import { QuestionMessageHandler } from '@/background/worker/handlers/QuestionMessageHandler';
import { SettingsMessageHandler } from '@/background/worker/handlers/SettingsMessageHandler';
import { MessageRouter } from '../../MessageRouter';

export interface AssistantBackgroundWorkerOptions {
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
    // dependencies
    const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings, initialSettings);
    const pageClient = new PageClient(transport);

    // handlers
    const popupLifecycleHandler = new PopupLifecycleMessageHandler(pageClient);
    const settingsHandler = new SettingsMessageHandler(pageClient, settingsStorage);
    const pageInspectorHandler = new PageInspectorMessageHandler(pageClient);
    const questionHandler = new QuestionMessageHandler(pageClient, apiClient, historyStorage);
    const elementNavigationHandler = new ElementNavigationMessageHandler(pageClient);

    return new BackgroundWorker(transport, [
        MessageRouter.route(isPopupInitializeMessage, (message) =>
            popupLifecycleHandler.handlePopupInitialize(message),
        ),
        MessageRouter.route(isGetSettingsMessage, () => settingsHandler.handleGetSettings()),
        MessageRouter.route(isUpdateSettingsMessage, (message) => settingsHandler.handleUpdateSettings(message)),
        MessageRouter.route(isOpenPageInspectorMessage, (message) =>
            pageInspectorHandler.handleOpenPageInspector(message),
        ),
        MessageRouter.route(isAskQuestionMessage, (message) => questionHandler.handleAskQuestion(message)),
        MessageRouter.route(isGetPrevQuestionsMessage, (message) => questionHandler.handleGetPrevQuestions(message)),
        MessageRouter.route(isNavigateToElementMessage, (message) =>
            elementNavigationHandler.handleNavigateToElement(message),
        ),
    ]);
}
