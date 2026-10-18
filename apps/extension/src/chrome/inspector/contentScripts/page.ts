import { ChromeTransportService, withTransportLogging } from '@/adapters';
import { BackgroundClient } from '@/background';
import { collectPageTrailContextOnly } from '@/core/document/collect';

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const backgroundClient = new BackgroundClient(transport);

    backgroundClient.subscribeToInspectorPageMessages({
        onCollectPageTrailContextOnly: () => collectPageTrailContextOnly(window, document).toDto(),
    });
})();
