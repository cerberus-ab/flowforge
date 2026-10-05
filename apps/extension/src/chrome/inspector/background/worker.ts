import { config } from '@/config';
import { ChromeTransportService } from '@/adapters/chrome/ChromeTransportService';
import { ChromeLocalStorage } from '@/adapters/chrome/ChromeLocalStorage';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { BackgroundWorker } from '@/background/BackgroundWorker';
import { PageInspectorMessageHandler } from '@/background/handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '@/background/handlers/PopupLifecycleMessageHandler';
import { SettingsMessageHandler } from '@/background/handlers/SettingsMessageHandler';

(function main() {
    const transport = new ChromeTransportService();
    const localStorage = new ChromeLocalStorage();
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);

    const backgroundWorker = new BackgroundWorker(transport, [
        new PopupLifecycleMessageHandler(transport),
        new SettingsMessageHandler(transport, settingsStorage),
        new PageInspectorMessageHandler(transport),
    ]);
    backgroundWorker.start();
})();
