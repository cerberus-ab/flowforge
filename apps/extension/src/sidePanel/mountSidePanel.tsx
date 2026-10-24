import { render } from 'preact';

import { ChromeTransportService, withTransportLogging } from '@/adapters';
import { BackgroundClient } from '@/background';
import { DocumentRootInjector } from '@/services/RootInjector';
import { Main } from '@/shared/components/Main';
import { useSettings } from '@/shared/hooks/useSettings';
import { SidePanelApp } from './SidePanelApp';

function SidePanelAppRoot({ backgroundClient, pageId }: { backgroundClient: BackgroundClient; pageId: number | null }) {
    const settings = useSettings({ backgroundClient });

    if (settings.status === 'loading') return null;
    return (
        <Main theme={settings.theme}>
            <SidePanelApp
                backgroundClient={backgroundClient}
                pageId={pageId}
                devMode={settings.devMode}
                onDevModeChange={settings.setDevMode}
                selectedTab={settings.inspectorTab}
                markdownPreferences={{
                    detailLevel: settings.markdownDetailLevel,
                    blocks: settings.markdownBlocks,
                }}
                onSelectedTabChange={settings.setInspectorTab}
                onMarkdownPreferencesChange={settings.setMarkdownPreferences}
            />
        </Main>
    );
}

/** Mounts the shared side-panel UI for a Chrome extension entry point. */
export function mountSidePanel(rootId: string): void {
    const transport = withTransportLogging(new ChromeTransportService());
    const backgroundClient = new BackgroundClient(transport);
    const rootInjector = new DocumentRootInjector();

    const doMount = () => {
        // The URL binds the panel to its original tab before its message listener is ready.
        const pageId = Number(new URLSearchParams(window.location.search).get('pageId')) || null;
        if (pageId === null) {
            void chrome.windows
                .getCurrent()
                .then(({ id }) => (id === undefined ? undefined : chrome.sidePanel.close({ windowId: id })))
                .catch(() => undefined);
            return;
        }

        const root = rootInjector.inject(document, rootId);

        render(<SidePanelAppRoot backgroundClient={backgroundClient} pageId={pageId} />, root.mountPoint);
        console.log('[FlowForge] Side panel loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
}
