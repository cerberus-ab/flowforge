import type { PageOnboardingClient } from '@/page/client/contract';
import { requirePageId, type MessageContext, type OpenOnboardingMessage } from '@/messaging';

export class OnboardingMessageHandler {
    private readonly pageClient: PageOnboardingClient;

    constructor(pageClient: PageOnboardingClient) {
        this.pageClient = pageClient;
    }

    async handleOpenOnboarding(message: OpenOnboardingMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);
        const { question, result } = message.data;

        await this.pageClient.startOnboarding(pageId, {
            title: result.topic ?? question,
            description: result.answer,
            mode: result.mode,
            elements: result.elements,
        });
    }
}
