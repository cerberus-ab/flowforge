import { render } from 'preact';

import styles from '@/page/page.css?inline';

import { PageApp } from '@/page/PageApp';
import { ChromeTransportService } from '@/adapters/chrome/ChromeTransportService';
import { ShadowRootInjector } from '@/core/services/RootInjector';
import { chromeConstants } from '@/chrome/constants';
import { Main } from '@/shared/components/Main';
import { useSettings } from '@/shared/hooks/useSettings';
import type { TransportService } from '@/adapters/interface';

function PageAppRoot({ transport }: { transport: TransportService }) {
    const settings = useSettings({ transport });

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <PageApp transport={transport} devMode={settings.devMode} onDevModeChange={settings.setDevMode} />
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
