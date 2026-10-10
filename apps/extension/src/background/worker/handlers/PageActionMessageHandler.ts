import type { PageNavigationClient, PageOnboardingClient } from '@/page/client/contract';
import {
    MessageRouter,
    isNavigateToElementMessage,
    isOpenOnboardingMessage,
    requirePageId,
    type MessageContext,
    type NavigateToElementMessage,
    type OpenOnboardingMessage,
} from '@/messaging';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles page-facing actions initiated from the popup.
 * Navigation clears existing extension UI before highlighting an element.
 * Onboarding messages forward the question result as a page wizard payload.
 */
export class PageActionMessageHandler implements BackgroundMessageHandler {
    private readonly pageClient: PageNavigationClient & PageOnboardingClient;

    constructor(pageClient: PageNavigationClient & PageOnboardingClient) {
        this.pageClient = pageClient;
    }

    routes() {
        return [
            MessageRouter.route(isNavigateToElementMessage, (message, context) =>
                this.handleNavigateToElement(message, context),
            ),
            MessageRouter.route(isOpenOnboardingMessage, (message, context) =>
                this.handleOpenOnboarding(message, context),
            ),
        ];
    }

    /** Clears the page UI and highlights the selected result element. */
    async handleNavigateToElement(message: NavigateToElementMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);

        await this.pageClient.clearPage(pageId);
        await this.pageClient.highlightElement(pageId, message.data.element);
    }

    /** Starts page onboarding using the question and its agent result. */
    async handleOpenOnboarding(message: OpenOnboardingMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);
        const { question, result } = message.data;

        await this.pageClient.clearPage(pageId);
        await this.pageClient.startOnboarding(pageId, {
            title: result.topic ?? question,
            description: result.answer,
            mode: result.mode,
            elements: result.elements,
        });
    }
}
