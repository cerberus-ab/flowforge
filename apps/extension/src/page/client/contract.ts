import type { AgentResultElement, PageTrailDto } from '@flowforge/contract';

import type { ExtensionSettings } from '@/services/SettingsStorage';
import type { StartOnboardingMessageData } from '@/messaging';

export interface PageLifecycleClient {
    clearPage(pageId: number): Promise<void>;
}

export interface PageSettingsClient {
    notifySettingsUpdated(pageId: number, settings: ExtensionSettings): Promise<void>;
}

export interface PageInspectorDataClient {
    collectPageTrailContextOnly(pageId: number): Promise<PageTrailDto>;
}

export interface PageInspectorClient extends PageInspectorDataClient {
    clearPage(pageId: number): Promise<void>;
    openInspector(pageId: number, tab?: string): Promise<void>;
}

export interface PageQuestionClient {
    clearPage(pageId: number): Promise<void>;
    collectPageTrail(pageId: number): Promise<PageTrailDto>;
    containsElements(pageId: number, dataIds: string[]): Promise<boolean>;
    getUrl(pageId: number): Promise<string>;
}

export interface PageOnboardingClient {
    startOnboarding(pageId: number, data: StartOnboardingMessageData): Promise<void>;
}

export interface PageNavigationClient {
    clearPage(pageId: number): Promise<void>;
    highlightElement(pageId: number, element: AgentResultElement): Promise<void>;
}
