import type { AgentResultElement, PageTrailDto } from '@flowforge/contract';

import type { TransportService } from '@/adapters';
import type { PageMessage, PageMessageResponseData, StartOnboardingMessageData } from '@/messaging';
import type { ExtensionSettings } from '@/types';

import type {
    PageInspectorClient,
    PageLifecycleClient,
    PageNavigationClient,
    PageQuestionClient,
    PageSettingsClient,
} from './contract';

/**
 * Provides typed page operations to background handlers.
 * Each operation targets an explicit page and unwraps transport responses.
 * The implemented capability interfaces keep handler dependencies narrow.
 */
export class PageClient
    implements PageLifecycleClient, PageSettingsClient, PageInspectorClient, PageQuestionClient, PageNavigationClient
{
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    /** Returns the url associated with a page. */
    getUrl(pageId: number): Promise<string> {
        return this.transport.getPageUrl(pageId);
    }

    /** Clears extension UI from the target page. */
    clearPage(pageId: number): Promise<void> {
        return this.sendToPage(pageId, { type: 'CLEAR_PAGE' });
    }

    /** Collects the current page's trail for question context. */
    collectPageTrail(pageId: number): Promise<PageTrailDto> {
        return this.sendToPage(pageId, { type: 'COLLECT_PAGE_TRAIL' });
    }

    /** Highlights an agent result element on the target page. */
    highlightElement(pageId: number, element: AgentResultElement): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'HIGHLIGHT_ELEMENT',
            data: { element },
        });
    }

    /** Starts the onboarding wizard on the target page. */
    startOnboarding(pageId: number, data: StartOnboardingMessageData): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'START_ONBOARDING',
            data,
        });
    }

    /** Opens the inspector panel on the target page. */
    openInspector(pageId: number, tab?: string): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'OPEN_INSPECTOR',
            data: { tab },
        });
    }

    /** Notifies the target page that extension settings have changed. */
    notifySettingsUpdated(pageId: number, settings: ExtensionSettings): Promise<void> {
        return this.sendToPage(pageId, {
            type: 'SETTINGS_UPDATED',
            data: settings,
        });
    }

    /** Sends a typed message to a page and unwraps its response. */
    private async sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponseData<M>> {
        const response = await this.transport.sendToPage(pageId, message);

        if (!response.success) {
            throw new Error(response.error);
        }
        return ('data' in response ? response.data : undefined) as PageMessageResponseData<M>;
    }
}
