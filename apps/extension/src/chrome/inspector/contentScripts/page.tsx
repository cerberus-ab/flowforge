import { render } from 'preact';

import styles from './page.css?inline';

import { ChromeTransportService, withTransportLogging } from '@/adapters';
import { ShadowRootInjector } from '@/core/services/RootInjector';
import { mountConstants } from '@/chrome/inspector/constants';
import { useSettings } from '@/shared/hooks/useSettings';
import { Main } from '@/shared/components/Main';
import { useInspectorPage } from '@/chrome/inspector/contentScripts/hooks/useInspectorPage';
import { Inspector } from '@/page/components/Inspector';
import { BackgroundClient } from '@/background';
import type { InspectorPageBackgroundClient } from '@/background';

interface InspectorPageAppProps {
    backgroundClient: InspectorPageBackgroundClient;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

function InspectorPageApp({ backgroundClient, devMode, onDevModeChange }: InspectorPageAppProps) {
    const { inspector } = useInspectorPage({ backgroundClient, devMode, onDevModeChange });

    return (
        <div className="flowforge-page flowforge-page--inspector" data-testid="flowforge-inspector-page">
            {inspector && <Inspector {...inspector} />}
        </div>
    );
}

function InspectorPageAppRoot({ backgroundClient }: { backgroundClient: BackgroundClient }) {
    const settings = useSettings({ backgroundClient });

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <InspectorPageApp
                backgroundClient={backgroundClient}
                devMode={settings.devMode}
                onDevModeChange={settings.setDevMode}
            />
        </Main>
    );
}

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const backgroundClient = new BackgroundClient(transport);
    const rootInjector = new ShadowRootInjector();

    const doMount = () => {
        const root = rootInjector.inject(document, mountConstants.INSPECTOR_PAGE_ROOT_ID, { overlay: true });
        root.host.dataset.testid = 'flowforge-inspector-page-root';
        rootInjector.injectStyles(root, styles);
        render(<InspectorPageAppRoot backgroundClient={backgroundClient} />, root.mountPoint);
        console.log('[FlowForge] Inspector content script loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
