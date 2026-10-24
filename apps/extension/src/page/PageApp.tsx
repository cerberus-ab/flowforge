import type { PageBackgroundClient } from '@/background';

import { usePage } from '@/page/hooks/usePage';
import { Highlight } from '@/page/components/Highlight';
import { Wizard } from '@/page/components/Wizard';
import { Inspector } from '@/page/components/Inspector';
import { ModalContainer } from '@/shared/components/ModalContainer/ModalContainer';
import type { InspectorTabId } from '@/shared/types/inspector';
import type { MarkdownPreferences } from '@/shared/types/settings';

export interface PageAppProps {
    backgroundClient: PageBackgroundClient;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
    selectedTab?: InspectorTabId;
    markdownPreferences?: MarkdownPreferences;
    onSelectedTabChange?: (tab: InspectorTabId) => void | Promise<void>;
    onMarkdownPreferencesChange?: (preferences: MarkdownPreferences) => void | Promise<void>;
    onReady?: () => void;
    inspectorOverlay?: boolean;
}

export function PageApp({
    backgroundClient,
    devMode,
    onDevModeChange,
    selectedTab,
    markdownPreferences,
    onSelectedTabChange,
    onMarkdownPreferencesChange,
    onReady,
    inspectorOverlay = true,
}: PageAppProps) {
    const { highlights, wizard, inspector } = usePage({
        backgroundClient,
        devMode,
        onDevModeChange,
        onReady,
        inspectorOverlay,
    });

    return (
        <div className="flowforge-page" data-testid="flowforge-page">
            {highlights.length > 0 && (
                <div className="flowforge-highlights-container" data-testid="flowforge-highlights">
                    {highlights.map((highlight) => (
                        <Highlight key={highlight.id} {...highlight} />
                    ))}
                </div>
            )}
            {wizard && <Wizard {...wizard} />}
            {inspectorOverlay && inspector && (
                <ModalContainer
                    onClose={inspector.close}
                    title="FlowForge — Page Inspector"
                    titleId="flowforge-inspector-title"
                    descriptionId="flowforge-inspector-subtitle"
                >
                    <Inspector
                        pageTrail={inspector.pageTrail}
                        initialTab={inspector.initialTab}
                        selectedTab={selectedTab}
                        markdownPreferences={markdownPreferences}
                        onSelectedTabChange={onSelectedTabChange}
                        onMarkdownPreferencesChange={onMarkdownPreferencesChange}
                        devMode={inspector.devMode}
                        onDevModeChange={inspector.onDevModeChange}
                    />
                </ModalContainer>
            )}
        </div>
    );
}
