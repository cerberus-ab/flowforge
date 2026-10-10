import { EmbedLocalStorage, EmbedTransportService } from '@/adapters';
import type { ApiClient } from '@/core/services/ApiClient';
import type { ExtensionSettings } from '@/types';
import type { BackgroundWorker } from '@/background';
import { createAssistantBackgroundWorker } from '@/background';
import { EmbedSessionStorage } from '@/adapters/embed/EmbedSessionStorage';

export function createWorker(
    transport: EmbedTransportService,
    apiClient: ApiClient,
    initialSettings: Partial<ExtensionSettings> = {},
): BackgroundWorker {
    const localStorage = new EmbedLocalStorage();
    const sessionStorage = new EmbedSessionStorage();

    return createAssistantBackgroundWorker({ transport, localStorage, sessionStorage, apiClient, initialSettings });
}
