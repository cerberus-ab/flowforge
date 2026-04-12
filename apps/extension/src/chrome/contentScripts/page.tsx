import { render } from 'preact';

import styles from '#self/page/page.css?inline';

import { PageApp } from '#self/page/PageApp';
import { ChromeTransportService } from '#self/adapters/chrome/ChromeTransportService';
import { ShadowRootInjector } from '#self/core/services/RootInjector';

(function main() {
    const ROOT_ID = 'flowforge-page-root';
    const transport = new ChromeTransportService();
    const rootInjector = new ShadowRootInjector();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    function init() {
        const root = rootInjector.inject(ROOT_ID, { overlay: true });
        rootInjector.injectStyles(root, styles);

        render(<PageApp transport={transport} />, root.mountPoint);
        console.log('[FlowForge] Content script loaded');
    }
})();
