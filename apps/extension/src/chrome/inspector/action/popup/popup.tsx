import { render } from 'preact';

import './popup.css';

import { DocumentRootInjector } from '@/core/services/RootInjector';
import { mountConstants } from '@/chrome/inspector/constants';
import { ChromeTransportService } from '@/adapters/chrome/ChromeTransportService';
import type { TransportService } from '@/adapters/interface';
import { useSettings } from '@/shared/hooks/useSettings';
import { Main } from '@/shared/components/Main';
import type { ExtensionSettingsTheme } from '@/types';
import { useInspectorPopup } from '@/chrome/inspector/action/popup/hooks/useInspectorPopup';
import { useCallback } from 'preact/hooks';
import { Opener } from '@/chrome/inspector/action/popup/components/Opener';
import { Link } from '@/shared/components/Link';
import { ButtonText } from '@/shared/components/Button';

export interface InspectorPopupAppProps {
    transport: TransportService;
    theme: ExtensionSettingsTheme;
    onToggleTheme: () => Promise<void>;
    onClose?: () => void;
}

export function InspectorPopupApp({ transport, theme, onToggleTheme, onClose }: InspectorPopupAppProps) {
    const { copyright, github, website, openPageInspector } = useInspectorPopup({ transport });

    // Handle open page inspector and close popup
    const handleOpenPageInspector = useCallback(
        async (tab?: string) => {
            await openPageInspector(tab);
            onClose?.();
        },
        [openPageInspector, onClose],
    );

    return (
        <div className="flowforge-popup flowforge-popup--inspector" data-testid="flowforge-inspector-popup">
            <header className="flowforge-popup__header flowforge-popup__header--parallax">
                <h2 className="flowforge-popup__header-title">FlowForge</h2>
                <p className="flowforge-popup__header-subtitle">Page Inspector</p>
            </header>
            <div className="flowforge-popup__content" data-testid="flowforge-inspector-popup-content">
                <Opener website={website} onOpenPageInspector={handleOpenPageInspector} />

                <footer className="flowforge-popup__footer">
                    <div className="flowforge-popup__footer-actions">
                        <Link href={github}>Star me</Link>
                        <ButtonText onClick={onToggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} theme</ButtonText>
                    </div>
                    <div className="flowforge-popup__footer-copyright">{copyright}</div>
                </footer>
            </div>
        </div>
    );
}

function InspectorPopupAppRoot({ transport }: { transport: TransportService }) {
    const settings = useSettings({ transport });

    if (settings.status === 'loading') {
        return null;
    }
    return (
        <Main theme={settings.theme}>
            <InspectorPopupApp
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
        const root = rootInjector.inject(document, mountConstants.INSPECTOR_POPUP_ROOT_ID);
        render(<InspectorPopupAppRoot transport={transport} />, root.mountPoint);
        console.log('[FlowForge] Inspector popup loaded');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doMount);
    } else {
        doMount();
    }
})();
