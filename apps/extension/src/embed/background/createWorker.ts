import type { BackgroundWorker } from '@/background/worker/BackgroundWorker';
import { createBackgroundWorker } from '@/background/worker/factories/createBackgroundWorker';
import { EmbedLocalStorage, EmbedTransportService } from '@/adapters';
import type { ApiClient } from '@/core/services/ApiClient';
import type { ExtensionSettings } from '@/types';

export function createWorker(
    transport: EmbedTransportService,
    apiClient: ApiClient,
    initialSettings: Partial<ExtensionSettings> = {},
): BackgroundWorker {
    const localStorage = new EmbedLocalStorage();

    return createBackgroundWorker({ transport, localStorage, apiClient, initialSettings });
}
