import { EmbedLocalStorage, EmbedTransportService } from '@/adapters';
import type { ApiClient } from '@/core/services/ApiClient';
import type { ExtensionSettings } from '@/types';
import type { BackgroundWorker } from '@/background';
import { createAssistantBackgroundWorker } from '@/background';

export function createWorker(
    transport: EmbedTransportService,
    apiClient: ApiClient,
    initialSettings: Partial<ExtensionSettings> = {},
): BackgroundWorker {
    const localStorage = new EmbedLocalStorage();

    return createAssistantBackgroundWorker({ transport, localStorage, apiClient, initialSettings });
}
