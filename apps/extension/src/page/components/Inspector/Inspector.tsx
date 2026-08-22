import type { TargetedPointerEvent } from 'preact';
import { useEffect, useId, useMemo, useState } from 'preact/hooks';
import {
    type LucideIcon,
    BadgeInfo,
    BookOpenText,
    ChartNoAxesColumn,
    FileText,
    ListTree,
    MousePointerClick,
} from 'lucide-preact';
import { getEventTarget } from '@/core/utils/dom';
import type { InspectorViewModel } from '@/page/hooks/usePage';
import { Button } from '@/shared/components/Button';
import { JsonViewer } from '@/shared/components/JsonViewer';
import { MarkdownViewer } from '@/shared/components/MarkdownViewer';
import { Switch } from '@/shared/components/Switch';
import { Tabs } from '@/shared/components/Tabs';
import { InspectorPageMetadata } from '@/page/components/Inspector/components/Metadata';
import { semMarkdown } from '@flowforge/page-trail';
import {
    InspectorPageContainer,
    InspectorPageContent,
    InspectorPageInteractive,
} from '@/page/components/Inspector/components/Elements';

type InspectorTab = {
    id: 'basics' | 'container' | 'content' | 'interactive' | 'semanticView' | 'metadata';
    label: string;
    icon: LucideIcon;
    devModeOnly?: boolean;
};

const inspectorTabs: InspectorTab[] = [
    { id: 'basics', label: 'Basics', icon: BadgeInfo },
    { id: 'container', label: 'Container', icon: ListTree },
    { id: 'content', label: 'Content', icon: BookOpenText },
    { id: 'interactive', label: 'Interactive', icon: MousePointerClick },
    { id: 'semanticView', label: 'Semantic view', icon: FileText },
    { id: 'metadata', label: 'Metadata', icon: ChartNoAxesColumn, devModeOnly: true },
];

function resolveInspectorTabId(tabs: readonly InspectorTab[], preferredTab?: string): InspectorTab['id'] {
    const tab = tabs.find((item) => item.id === preferredTab);

    return tab?.id ?? tabs[0]!.id;
}

// Exports

export function Inspector({ pageTrail, initialTab, close, devMode, onDevModeChange }: InspectorViewModel) {
    const availableTabs = useMemo(() => inspectorTabs.filter((tab) => !tab.devModeOnly || devMode), [devMode]);
    const [activeTab, setActiveTab] = useState<InspectorTab['id']>(() =>
        resolveInspectorTabId(availableTabs, initialTab),
    );
    const tabsIdPrefix = `flowforge-inspector-tabs-${useId()}`;
    const getTabId = (id: string) => `${tabsIdPrefix}-tab-${id}`;
    const getPanelId = (id: string) => `${tabsIdPrefix}-panel-${id}`;

    // Reset the active tab
    useEffect(() => {
        if (availableTabs.some((tab) => tab.id === activeTab)) return;

        setActiveTab(resolveInspectorTabId(availableTabs, initialTab));
    }, [activeTab, availableTabs, initialTab]);

    // Close on esc
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;

            const target = getEventTarget(e);
            // if typing in an input, don't close
            if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

            e.preventDefault();
            close();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [close]);

    // Close on click outside the inspector
    const handleContainerPointerDown = (e: TargetedPointerEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            close();
        }
    };

    return (
        <div className="flowforge-inspector-container" onPointerDown={handleContainerPointerDown}>
            <div
                className="flowforge-inspector"
                role="dialog"
                aria-modal="false"
                aria-labelledby="flowforge-inspector-title"
                aria-describedby="flowforge-inspector-subtitle"
            >
                <div className="flowforge-inspector__header">
                    <div className="flowforge-inspector__header-main">
                        <h3 id="flowforge-inspector-title" className="flowforge-inspector__header-title">
                            Inspect page context
                        </h3>
                        <p id="flowforge-inspector-subtitle" className="flowforge-inspector__header-subtitle">
                            See what FlowForge understands about this page
                        </p>
                    </div>
                    <div className="flowforge-inspector__header-ctrl">
                        <Switch checked={devMode} label="Dev mode" onCheckedChange={onDevModeChange} />
                        <Button variant="secondary" size="small" onClick={close}>
                            Close
                        </Button>
                    </div>
                </div>
                <div className="flowforge-inspector__nav">
                    <Tabs
                        tabs={availableTabs}
                        activeId={activeTab}
                        onChange={(id) => setActiveTab(id as InspectorTab['id'])}
                        getTabId={getTabId}
                        getPanelId={getPanelId}
                        autoFocus
                    />
                </div>
                <div
                    id={getPanelId(activeTab)}
                    className="flowforge-inspector__content"
                    role="tabpanel"
                    aria-labelledby={getTabId(activeTab)}
                >
                    {activeTab === 'basics' && <JsonViewer value={pageTrail.basics} sortKeys />}
                    {activeTab === 'container' && <InspectorPageContainer container={pageTrail.container} devMode />}
                    {activeTab === 'content' && <InspectorPageContent content={pageTrail.content} devMode />}
                    {activeTab === 'interactive' && (
                        <InspectorPageInteractive interactive={pageTrail.interactive} devMode />
                    )}
                    {activeTab === 'semanticView' && <MarkdownViewer value={semMarkdown(pageTrail)} />}
                    {activeTab === 'metadata' && devMode && <JsonViewer value={pageTrail.metadata} sortKeys />}
                </div>
                <div className="flowforge-inspector__footer">
                    <InspectorPageMetadata metadata={pageTrail.metadata} devMode />
                </div>
            </div>
        </div>
    );
}
