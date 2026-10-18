import type { ExtensionSettings } from '@/types';
import type {
    AskQuestionResponse,
    PreviousQuestionsResponse,
    RestoreQueryResponse,
    StartOnboardingMessageData,
    QueryFinishedMessageData,
    ContainsElementsMessageData,
    HighlightElementMessageData,
    OpenInspectorMessageData,
    SettingsUpdatedMessageData,
} from '@/messaging';
import type { AgentResult, AgentResultElement, PageTrailDto } from '@flowforge/contract';

/* message callbacks */
export interface PageMessageCallbacks {
    onCollectPageTrail: () => PageTrailDto;
    onCollectPageTrailContextOnly: () => PageTrailDto;
    onContainsElements: (data: ContainsElementsMessageData) => boolean;
    onClearPage: () => void;
    onStartOnboarding: (data: StartOnboardingMessageData) => void;
    onHighlightElement: (data: HighlightElementMessageData) => void;
    onOpenInspector: (data: OpenInspectorMessageData) => void;
}

export interface InspectorPageMessageCallbacks {
    onCollectPageTrailContextOnly: () => PageTrailDto;
}

export interface SettingsMessageCallbacks {
    onSettingsUpdated: (data: SettingsUpdatedMessageData) => void;
}

export interface PopupMessageCallbacks {
    onQueryFinished: (data: QueryFinishedMessageData) => void;
}

/* client interfaces */
export interface PopupBackgroundClient {
    notifyPopupOpened(): Promise<void>;
    restoreQuery(): Promise<RestoreQueryResponse>;
    clearQuery(queryId: string): Promise<boolean>;
    getPreviousQuestions(): Promise<PreviousQuestionsResponse>;
    askQuestion(question: string): Promise<AskQuestionResponse>;
    subscribeToPopupMessages(callbacks: PopupMessageCallbacks): () => void;
    openOnboarding(question: string, result: AgentResult): Promise<void>;
    navigateToElement(element: AgentResultElement): Promise<void>;
    openPageInspector(tab?: string): Promise<void>;
}

export interface PageBackgroundClient {
    subscribeToPageMessages(callbacks: PageMessageCallbacks): () => void;
}

export interface SettingsBackgroundClient {
    getSettings(): Promise<ExtensionSettings>;
    updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings>;
    subscribeToSettingsMessages(callbacks: SettingsMessageCallbacks): () => void;
}

export interface InspectorPopupBackgroundClient {
    preparePageInspector(): Promise<number>;
    openPageInspectorForPage(pageId: number): Promise<void>;
}

export interface PageInspectorDataBackgroundClient {
    getPageInspectorData(pageId: number): Promise<PageTrailDto>;
}

export interface InspectorPageBackgroundClient {
    subscribeToInspectorPageMessages(callbacks: InspectorPageMessageCallbacks): () => void;
}

export type AssistantBackgroundClient = PopupBackgroundClient & PageBackgroundClient & SettingsBackgroundClient;
