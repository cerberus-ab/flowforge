import { render } from 'preact';

import styles from '#self/page/page.css?inline';

import { PageApp } from '#self/page/PageApp';
import { ChromeTransportService } from '#self/adapters/chrome/ChromeTransportService';
import { ShadowRootInjector } from '#self/core/services/RootInjector';
import { chromeConstants } from '#self/chrome/constants';
import { Main } from '#self/shared/components/Main';
import { useSettings } from '#self/shared/hooks/useSettings';
import type { TransportService } from '#self/adapters/interface';

function PageAppRoot({ transport }: { transport: TransportService }) {
    const { theme } = useSettings({ transport });

    return (
        <Main theme={theme}>
            <PageApp transport={transport} />
        </Main>
    );
}

(function main() {
    const transport = new ChromeTransportService();
    const rootInjector = new ShadowRootInjector();

    const doMount = () => {
        const root = rootInjector.inject(document, chromeConstants.PAGE_ROOT_ID, { overlay: true });
        rootInjector.injectStyles(root, styles);
        render(<PageAppRoot transport={transport} />, root.mountPoint);
        console.log('[FlowForge] Content script loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
