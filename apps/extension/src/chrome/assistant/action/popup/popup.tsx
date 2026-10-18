import { render } from 'preact';

import '@/popup/index.css';

import { PopupApp } from '@/popup/PopupApp';
import { ChromeTransportService, withTransportLogging } from '@/adapters';
import { DocumentRootInjector } from '@/services/RootInjector';
import { mountConstants } from '@/chrome/assistant/constants';
import { useSettings } from '@/shared/hooks/useSettings';
import { Main } from '@/shared/components/Main';
import { BackgroundClient } from '@/background';
import { useSidePanelOpener } from '@/chrome/sidePanel/hooks/useSidePanelOpener';

function PopupAppRoot({ backgroundClient }: { backgroundClient: BackgroundClient }) {
    const settings = useSettings({ backgroundClient });
    const sidePanelOpener = useSidePanelOpener(backgroundClient);

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <PopupApp
                variant="page"
                backgroundClient={backgroundClient}
                theme={settings.theme}
                onToggleTheme={settings.toggleTheme}
                onClose={() => window.close()}
                sidePanelOpener={sidePanelOpener}
            />
        </Main>
    );
}

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const backgroundClient = new BackgroundClient(transport);
    const rootInjector = new DocumentRootInjector();

    const doMount = () => {
        const root = rootInjector.inject(document, mountConstants.POPUP_ROOT_ID);
        render(<PopupAppRoot backgroundClient={backgroundClient} />, root.mountPoint);
        console.log('[FlowForge] Popup loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
