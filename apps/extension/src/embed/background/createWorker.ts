import { EmbedLocalStorage } from '@/adapters';
import type { TransportService } from '@/adapters';
import type { ApiClient } from '@/services/ApiClient';
import type { ExtensionSettingsPatch } from '@/shared/types/settings';
import type { BackgroundWorker } from '@/background';
import { createAssistantBackgroundWorker } from '@/background';
import { EmbedSessionStorage } from '@/adapters/embed/EmbedSessionStorage';

export function createWorker(
    transport: TransportService,
    apiClient: ApiClient,
    initialSettings: ExtensionSettingsPatch = {},
): BackgroundWorker {
    const localStorage = new EmbedLocalStorage();
    const sessionStorage = new EmbedSessionStorage();

    return createAssistantBackgroundWorker({ transport, localStorage, sessionStorage, apiClient, initialSettings });
}
