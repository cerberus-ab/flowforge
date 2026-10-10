import type { BackgroundWorker } from '@/background/BackgroundWorker';
import { createBackgroundWorker } from '@/background/createBackgroundWorker';
import { EmbedLocalStorage, EmbedTransportService } from '@/adapters';
import type { ApiClient } from '@/core/services/ApiClient.ts';
import type { ExtensionSettings } from '@/types';

export function createWorker(
    transport: EmbedTransportService,
    apiClient: ApiClient,
    initialSettings: Partial<ExtensionSettings> = {},
): BackgroundWorker {
    const localStorage = new EmbedLocalStorage();

    return createBackgroundWorker({ transport, localStorage, apiClient, initialSettings });
}
