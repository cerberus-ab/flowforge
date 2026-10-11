import type { ExtensionSettings } from '@/types';
import type { PreviousQuestionsResponse, StartOnboardingMessageData } from '@/messaging';
import type { AgentResult, AgentResultElement, PageTrailDto, QueryResponse } from '@flowforge/contract';
import type { TrailFingerprint } from '@flowforge/page-trail';

/* message callbacks */
export interface PageMessageCallbacks {
    onCollectPageTrail: () => PageTrailDto;
    onCollectTrailFingerprint: () => TrailFingerprint;
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
    notifyPopupOpened(): Promise<void>;
    getPreviousQuestions(): Promise<PreviousQuestionsResponse>;
    askQuestion(question: string): Promise<QueryResponse>;
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
    notifyPopupOpened(): Promise<void>;
    openPageInspector(tab?: string): Promise<void>;
}

export interface InspectorPageBackgroundClient {
    subscribeToInspectorPageMessages(callbacks: InspectorPageMessageCallbacks): () => void;
}

export type AssistantBackgroundClient = PopupBackgroundClient & PageBackgroundClient & SettingsBackgroundClient;
