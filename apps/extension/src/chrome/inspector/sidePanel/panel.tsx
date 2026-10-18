import { render } from 'preact';

import './panel.css';

import { mountConstants } from '@/chrome/inspector/constants';
import { ChromeTransportService, withTransportLogging } from '@/adapters';
import { BackgroundClient } from '@/background';
import { DocumentRootInjector } from '@/core/services/RootInjector';
import { Main } from '@/shared/components/Main';
import { useSettings } from '@/shared/hooks/useSettings';
import { SidePanelApp } from './SidePanelApp';

function SidePanelAppRoot({ backgroundClient, pageId }: { backgroundClient: BackgroundClient; pageId: number | null }) {
    const settings = useSettings({ backgroundClient });

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <SidePanelApp
                backgroundClient={backgroundClient}
                pageId={pageId}
                devMode={settings.devMode}
                onDevModeChange={settings.setDevMode}
            />
        </Main>
    );
}

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const backgroundClient = new BackgroundClient(transport);
    const rootInjector = new DocumentRootInjector();

    const doMount = () => {
        // Bind the panel to its original tab without racing a message sent before it starts listening.
        const pageIdParam = new URLSearchParams(window.location.search).get('pageId');
        const parsedPageId = pageIdParam !== null && /^\d+$/.test(pageIdParam) ? Number(pageIdParam) : NaN;
        const pageId = Number.isSafeInteger(parsedPageId) && parsedPageId > 0 ? parsedPageId : null;
        const root = rootInjector.inject(document, mountConstants.INSPECTOR_SIDE_PANEL_ROOT_ID);

        render(<SidePanelAppRoot backgroundClient={backgroundClient} pageId={pageId} />, root.mountPoint);
        console.log('[FlowForge] Inspector side panel loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
