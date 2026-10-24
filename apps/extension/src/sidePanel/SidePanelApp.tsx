import type { SidePanelBackgroundClient } from '@/background';
import { Inspector } from '@/page/components/Inspector';
import { useSidePanel } from './hooks/useSidePanel';
import type { ComponentChildren } from 'preact';

function SidePanelContainer({ children }: { children: ComponentChildren }) {
    return (
        <div className="flowforge-side-panel-container" data-testid="flowforge-side-panel-container">
            {children}
        </div>
    );
}

export interface SidePanelAppProps {
    backgroundClient: SidePanelBackgroundClient;
    pageId: number | null;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

export function SidePanelApp({ backgroundClient, pageId, devMode, onDevModeChange }: SidePanelAppProps) {
    const { snapshot, requestedTab, openVersion } = useSidePanel({ backgroundClient, pageId });

    return (
        <main className="flowforge-side-panel" data-testid="flowforge-side-panel">
            {pageId === null ? (
                <p role="status">Open Page Inspector from its extension popup.</p>
            ) : snapshot.status === 'error' ? (
                <p role="alert">Could not collect page data for this tab.</p>
            ) : snapshot.status === 'ready' ? (
                <SidePanelContainer>
                    <Inspector
                        key={openVersion}
                        pageTrail={snapshot.pageTrail}
                        initialTab={requestedTab}
                        devMode={devMode}
                        onDevModeChange={onDevModeChange}
                    />
                </SidePanelContainer>
            ) : (
                <p role="status">Loading page data…</p>
            )}
        </main>
    );
}
