import { render } from 'preact';

import '#self/popup/popup.css';

import { PopupApp } from '#self/popup/PopupApp';
import { ChromeTransportService } from '#self/adapters/chrome/ChromeTransportService';
import { DocumentRootInjector } from '#self/core/services/RootInjector';

(function main() {
    const ROOT_ID = 'flowforge-popup-root';
    const transport = new ChromeTransportService();
    const rootInjector = new DocumentRootInjector();

    document.addEventListener('DOMContentLoaded', () => {
        const root = rootInjector.inject(ROOT_ID);

        render(<PopupApp transport={transport} />, root.mountPoint);
        console.log('[FlowForge] Popup loaded');
    });
})();
