import { render } from 'preact';

import '#self/popup/popup.css';

import { PopupApp } from '#self/popup/PopupApp';
import { ChromeTransportService } from '#self/adapters/chrome/ChromeTransportService';
import { DocumentRootInjector } from '#self/core/services/RootInjector';
import { chromeConstants } from '#self/chrome/constants';
import { useSettings } from '#self/shared/hooks/useSettings';
import { Main } from '#self/shared/components/Main';
import type { TransportService } from '#self/adapters/interface';

function PopupAppRoot({ transport }: { transport: TransportService }) {
    const { theme, toggleTheme } = useSettings({ transport });

    return (
        <Main theme={theme}>
            <PopupApp variant="page" transport={transport} theme={theme} toggleTheme={toggleTheme} />
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
