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
    isOpenOnboardingMessage,
    isPopupOpenedMessage,
    isUpdateSettingsMessage,
} from '@/messaging';

import { ElementNavigationMessageHandler } from '../handlers/ElementNavigationMessageHandler';
import { PageInspectorMessageHandler } from '../handlers/PageInspectorMessageHandler';
import { OnboardingMessageHandler } from '../handlers/OnboardingMessageHandler';
import { PopupLifecycleMessageHandler } from '../handlers/PopupLifecycleMessageHandler';
import { QuestionMessageHandler } from '../handlers/QuestionMessageHandler';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';
import { MessageRouter } from '@/messaging';
import { BackgroundWorker } from '../BackgroundWorker';

interface AssistantBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: LocalStorage;
    apiClient: ApiClient;
    initialSettings?: Partial<ExtensionSettings>;
}

export function createAssistantBackgroundWorker({
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
    const onboardingHandler = new OnboardingMessageHandler(pageClient);

    return new BackgroundWorker(transport, [
        MessageRouter.route(isPopupOpenedMessage, (message, context) =>
            popupLifecycleHandler.handlePopupOpened(message, context),
        ),
        MessageRouter.route(isGetSettingsMessage, () => settingsHandler.handleGetSettings()),
        MessageRouter.route(isUpdateSettingsMessage, (message, context) =>
            settingsHandler.handleUpdateSettings(message, context),
        ),
        MessageRouter.route(isOpenPageInspectorMessage, (message, context) =>
            pageInspectorHandler.handleOpenPageInspector(message, context),
        ),
        MessageRouter.route(isAskQuestionMessage, (message, context) =>
            questionHandler.handleAskQuestion(message, context),
        ),
        MessageRouter.route(isGetPrevQuestionsMessage, (message, context) =>
            questionHandler.handleGetPrevQuestions(message, context),
        ),
        MessageRouter.route(isNavigateToElementMessage, (message, context) =>
            elementNavigationHandler.handleNavigateToElement(message, context),
        ),
        MessageRouter.route(isOpenOnboardingMessage, (message, context) =>
            onboardingHandler.handleOpenOnboarding(message, context),
        ),
    ]);
}
