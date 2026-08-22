import { render } from 'preact';

import '@/popup/popup.css';

import { PopupApp } from '@/popup/PopupApp';
import { ChromeTransportService } from '@/adapters/chrome/ChromeTransportService';
import { DocumentRootInjector } from '@/core/services/RootInjector';
import { chromeConstants } from '@/chrome/constants';
import { useSettings } from '@/shared/hooks/useSettings';
import { Main } from '@/shared/components/Main';
import type { TransportService } from '@/adapters/interface';

function PopupAppRoot({ transport }: { transport: TransportService }) {
    const settings = useSettings({ transport });

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <PopupApp
                variant="page"
                transport={transport}
                theme={settings.theme}
                onToggleTheme={settings.toggleTheme}
                onClose={() => window.close()}
            />
        </Main>
    );
}

(function main() {
    const transport = new ChromeTransportService();
    const rootInjector = new DocumentRootInjector();

    const doMount = () => {
        const root = rootInjector.inject(document, chromeConstants.POPUP_ROOT_ID);
        render(<PopupAppRoot transport={transport} />, root.mountPoint);
        console.log('[FlowForge] Popup loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
