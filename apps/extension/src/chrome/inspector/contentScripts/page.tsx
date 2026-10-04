import { render } from 'preact';

import styles from './page.css?inline';

import { ChromeTransportService } from '@/adapters/chrome/ChromeTransportService';
import { ShadowRootInjector } from '@/core/services/RootInjector';
import { chromeConstants } from '@/chrome/inspector/constants';
import type { TransportService } from '@/adapters/interface';
import { useSettings } from '@/shared/hooks/useSettings';
import { Main } from '@/shared/components/Main';
import { useInspectorPage } from '@/chrome/inspector/contentScripts/hooks/useInspectorPage.ts';
import { Inspector } from '@/page/components/Inspector';

interface InspectorPageAppProps {
    transport: TransportService;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

function InspectorPageApp({ transport, devMode, onDevModeChange }: InspectorPageAppProps) {
    const { inspector } = useInspectorPage({ transport, devMode, onDevModeChange });

    return (
        <div className="flowforge-page flowforge-page--inspector" data-testid="flowforge-pi-page">
            {inspector && <Inspector {...inspector} />}
        </div>
    );
}

function InspectorPageAppRoot({ transport }: { transport: TransportService }) {
    const settings = useSettings({ transport });

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <InspectorPageApp transport={transport} devMode={settings.devMode} onDevModeChange={settings.setDevMode} />
        </Main>
    );
}

(function main() {
    const transport = new ChromeTransportService();
    const rootInjector = new ShadowRootInjector();

    const doMount = () => {
        const root = rootInjector.inject(document, chromeConstants.PI_PAGE_ROOT_ID, { overlay: true });
        root.host.dataset.testid = 'flowforge-pi-chrome-page-root';
        rootInjector.injectStyles(root, styles);
        render(<InspectorPageAppRoot transport={transport} />, root.mountPoint);
        console.log('[FlowForge: Page Inspector] Content script loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
