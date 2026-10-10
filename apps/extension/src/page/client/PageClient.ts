import type { AgentResultElement, PageTrailDto } from '@flowforge/contract';

import type { Message, MessageResponse, TransportService } from '@/adapters';
import type { ExtensionSettings, StartOnboardingMessageData } from '@/types';

import type {
    PageInspectorClient,
    PageLifecycleClient,
    PageNavigationClient,
    PageQuestionClient,
    PageSettingsClient,
} from './contract';

export class PageClient
    implements PageLifecycleClient, PageSettingsClient, PageInspectorClient, PageQuestionClient, PageNavigationClient
{
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    getHostname(pageId: number): Promise<string> {
        return this.transport.getPageHostname(pageId);
    }

    clearPage(pageId: number): Promise<void> {
        return this.sendToPage(pageId, { type: 'CLEAR_PAGE' });
    }

    collectPageTrail(pageId: number): Promise<PageTrailDto> {
        return this.sendToPage<PageTrailDto>(pageId, { type: 'COLLECT_PAGE_TRAIL' });
    }

    highlightElement(pageId: number, element: AgentResultElement): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'HIGHLIGHT_ELEMENT',
            data: { element },
        });
    }

    startOnboarding(pageId: number, data: StartOnboardingMessageData): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'START_ONBOARDING',
            data,
        });
    }

    openInspector(pageId: number, tab?: string): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'OPEN_INSPECTOR',
            data: { tab },
        });
    }

    notifySettingsUpdated(pageId: number, settings: ExtensionSettings): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'SETTINGS_UPDATED',
            data: settings,
        });
    }

    private async sendToPage<D = undefined>(pageId: number, message: Message | Message<unknown>): Promise<D> {
        const response = await this.transport.sendToPage<MessageResponse<D>>(pageId, message);

        if (!response.success) {
            throw new Error(response.error);
        }
        return ('data' in response ? response.data : undefined) as D;
    }
}
