import type { PageInspectorDataBackgroundClient } from '@/background';
import { Inspector } from '@/page/components/Inspector';
import { useInspectorSidePanel } from './hooks/useInspectorSidePanel';

export interface SidePanelAppProps {
    backgroundClient: PageInspectorDataBackgroundClient;
    pageId: number | null;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

export function SidePanelApp({ backgroundClient, pageId, devMode, onDevModeChange }: SidePanelAppProps) {
    const snapshot = useInspectorSidePanel({ backgroundClient, pageId });

    return (
        <main className="flowforge-inspector-side-panel" data-testid="flowforge-inspector-side-panel">
            {pageId === null ? (
                <p role="status">Open Page Inspector from its extension popup.</p>
            ) : snapshot.status === 'error' ? (
                <p role="alert">Could not collect page data for this tab.</p>
            ) : snapshot.status === 'ready' ? (
                <Inspector
                    pageTrail={snapshot.pageTrail}
                    devMode={devMode}
                    onDevModeChange={onDevModeChange}
                    presentation="sidePanel"
                />
            ) : (
                <p role="status">Loading page data…</p>
            )}
        </main>
    );
}
