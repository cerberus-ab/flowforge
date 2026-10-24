import { render } from 'preact';

import styles from '@/page/index.css?inline';

import { PageApp } from '@/page/PageApp';
import { ChromeTransportService, withTransportLogging } from '@/adapters';
import { ShadowRootInjector } from '@/services/RootInjector';
import { mountConstants } from '@/chrome/assistant/constants';
import { Main } from '@/shared/components/Main';
import { useSettings } from '@/shared/hooks/useSettings';
import { BackgroundClient } from '@/background';

function PageAppRoot({ backgroundClient }: { backgroundClient: BackgroundClient }) {
    const settings = useSettings({ backgroundClient });

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <PageApp
                backgroundClient={backgroundClient}
                devMode={settings.devMode}
                onDevModeChange={settings.setDevMode}
                selectedTab={settings.inspectorTab}
                markdownPreferences={{
                    detailLevel: settings.markdownDetailLevel,
                    blocks: settings.markdownBlocks,
                }}
                onSelectedTabChange={settings.setInspectorTab}
                onMarkdownPreferencesChange={settings.setMarkdownPreferences}
                inspectorOverlay={false}
            />
        </Main>
    );
}

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const backgroundClient = new BackgroundClient(transport);
    const rootInjector = new ShadowRootInjector();

    const doMount = () => {
        const root = rootInjector.inject(document, mountConstants.PAGE_ROOT_ID, { overlay: true });
        root.host.dataset.testid = 'flowforge-page-root';
        rootInjector.injectStyles(root, styles);
        render(<PageAppRoot backgroundClient={backgroundClient} />, root.mountPoint);
        console.log('[FlowForge] Content script loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
