import type { AgentResultElement, PageTrailDto } from '@flowforge/contract';

import type { ExtensionSettings } from '@/types';
import type { StartOnboardingMessageData } from '@/messaging';

export interface PageLifecycleClient {
    clearPage(pageId: number): Promise<void>;
}

export interface PageSettingsClient {
    notifySettingsUpdated(pageId: number, settings: ExtensionSettings): Promise<void>;
}

export interface PageInspectorClient {
    clearPage(pageId: number): Promise<void>;
    openInspector(pageId: number, tab?: string): Promise<void>;
}

export interface PageQuestionClient {
    clearPage(pageId: number): Promise<void>;
    collectPageTrail(pageId: number): Promise<PageTrailDto>;
    getHostname(pageId: number): Promise<string>;
    startOnboarding(pageId: number, data: StartOnboardingMessageData): Promise<void>;
}

export interface PageNavigationClient {
    clearPage(pageId: number): Promise<void>;
    highlightElement(pageId: number, element: AgentResultElement): Promise<void>;
}
