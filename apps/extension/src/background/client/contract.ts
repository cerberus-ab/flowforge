import type { ExtensionSettings, StartOnboardingMessageData } from '@/types';
import type { AgentResultElement, PageTrailDto, QueryResponse } from '@flowforge/contract';

/* message callbacks */
export interface PageMessageCallbacks {
    onCollectPageTrail: () => PageTrailDto;
    onClearPage: () => void;
    onStartOnboarding: (data: StartOnboardingMessageData) => void;
    onHighlightElement: (element: AgentResultElement) => void;
    onOpenInspector: (tab?: string) => void;
}

export interface InspectorPageMessageCallbacks {
    onClearPage: () => void;
    onOpenInspector: (tab?: string) => void;
}

export interface SettingsMessageCallbacks {
    onSettingsUpdated: (settings: ExtensionSettings) => void;
}

/* client interfaces */
export interface PopupBackgroundClient {
    initializePopup(): Promise<void>;
    getPreviousQuestions(): Promise<string[]>;
    askQuestion(question: string): Promise<QueryResponse>;
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
    initializePopup(): Promise<void>;
    openPageInspector(tab?: string): Promise<void>;
}

export interface InspectorPageBackgroundClient {
    subscribeToInspectorPageMessages(callbacks: InspectorPageMessageCallbacks): () => void;
}

export type AssistantBackgroundClient = PopupBackgroundClient & PageBackgroundClient & SettingsBackgroundClient;
