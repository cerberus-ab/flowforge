import { config } from '@/config';
import { ChromeTransportService } from '@/adapters/chrome/ChromeTransportService';
import { ChromeLocalStorage } from '@/adapters/chrome/ChromeLocalStorage';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { InspectorBackgroundWorker } from './InspectorBackgroundWorker.ts';

(function main() {
    const transport = new ChromeTransportService();
    const localStorage = new ChromeLocalStorage();
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);

    const backgroundWorker = new InspectorBackgroundWorker(transport, settingsStorage);
    backgroundWorker.start();
})();
