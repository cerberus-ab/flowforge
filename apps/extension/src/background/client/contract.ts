import type { ExtensionSettings, GetPrevQuestionsMessageResponseData, StartOnboardingMessageData } from '@/types';
import type { AgentResultElement, PageTrailDto, QueryResponse } from '@flowforge/contract';

/* handlers */
export interface PageCommandHandlers {
    collectPageTrail: () => PageTrailDto;
    clearPage: () => void;
    startOnboarding: (data: StartOnboardingMessageData) => void;
    highlightElement: (element: AgentResultElement) => void;
    openInspector: (tab?: string) => void;
}

export interface InspectorPageCommandHandlers {
    clearPage: () => void;
    openInspector: (tab?: string) => void;
}

export interface SettingsCommandHandlers {
    settingsUpdated: (settings: ExtensionSettings) => void;
}

/* client interfaces */
export interface PopupBackgroundClient {
    initializePopup(): Promise<void>;
    getPreviousQuestions(): Promise<GetPrevQuestionsMessageResponseData>;
    askQuestion(question: string): Promise<QueryResponse>;
    navigateToElement(element: AgentResultElement): Promise<void>;
    openPageInspector(tab?: string): Promise<void>;
}

export interface PageBackgroundClient {
    subscribeToPageCommands(handlers: PageCommandHandlers): () => void;
}

export interface SettingsBackgroundClient {
    getSettings(): Promise<ExtensionSettings>;
    updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings>;
    subscribeToSettingsCommands(handlers: SettingsCommandHandlers): () => void;
}

export interface InspectorPopupBackgroundClient {
    initializePopup(): Promise<void>;
    openPageInspector(tab?: string): Promise<void>;
}

export interface InspectorPageBackgroundClient {
    subscribeToInspectorPageCommands(handlers: InspectorPageCommandHandlers): () => void;
}

export type AssistantBackgroundClient = PopupBackgroundClient & PageBackgroundClient & SettingsBackgroundClient;
