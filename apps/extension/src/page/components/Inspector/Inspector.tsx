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
import type { PageTrail } from '@flowforge/page-trail';
import type { InspectorTabId } from '@/shared/types/inspector';
import { DEFAULT_MARKDOWN_PREFERENCES, type MarkdownPreferences } from '@/shared/types/settings';
import { Switch } from '@/shared/components/Switch';
import { Tabs } from '@/shared/components/Tabs';
import { Tooltip } from '@/shared/components/Tooltip';
import { InspectorLineMetadata } from '@/page/components/Inspector/components/Metadata';
import {
    InspectorPageStructure,
    InspectorPageContent,
    InspectorPageInteractive,
    InspectorPageMarkdown,
    InspectorPageBasics,
    InspectorPageMetadata,
} from '@/page/components/Inspector/components/Pages';

type InspectorTab = {
    id: 'basics' | 'structure' | 'content' | 'interactive' | 'markdown' | 'metadata';
    label: string;
    icon: LucideIcon;
    tooltip: string;
    devModeOnly?: boolean;
};

const inspectorTabs: InspectorTab[] = [
    {
        id: 'basics',
        label: 'Basics',
        icon: BadgeInfo,
        tooltip: 'Page URL, title, description, language, and viewport.',
    },
    {
        id: 'structure',
        label: 'Structure',
        icon: ListTree,
        tooltip: 'Detected landmarks, sections, forms, and dialogs as a tree.',
    },
    {
        id: 'content',
        label: 'Content',
        icon: BookOpenText,
        tooltip: 'Top text and heading elements with scores and page context.',
    },
    {
        id: 'interactive',
        label: 'Interactive',
        icon: MousePointerClick,
        tooltip: 'Top buttons, links, inputs, and controls with labels, state, and context.',
    },
    {
        id: 'markdown',
        label: 'Markdown',
        icon: FileText,
        tooltip: 'Human-readable semantic snapshot used for inspection and copy.',
    },
    {
        id: 'metadata',
        label: 'Metadata',
        icon: ChartNoAxesColumn,
        tooltip: 'Collection counts, limit flags, timing, depth, and timestamp.',
        devModeOnly: true,
    },
];

function resolveInspectorTabId(tabs: readonly InspectorTab[], preferredTab?: string): InspectorTab['id'] {
    const tab = tabs.find((item) => item.id === preferredTab);

    return tab?.id ?? tabs[0]!.id;
}

// Exports

export interface InspectorProps {
    pageTrail: PageTrail;
    initialTab?: string;
    selectedTab?: InspectorTabId;
    markdownPreferences?: MarkdownPreferences;
    onSelectedTabChange?: (tab: InspectorTabId) => void | Promise<void>;
    onMarkdownPreferencesChange?: (preferences: MarkdownPreferences) => void | Promise<void>;
    devMode: boolean;
    onDevModeChange: (enabled: boolean) => void | Promise<void>;
}

export function Inspector({
    pageTrail,
    initialTab,
    selectedTab,
    markdownPreferences = DEFAULT_MARKDOWN_PREFERENCES,
    onSelectedTabChange,
    onMarkdownPreferencesChange,
    devMode,
    onDevModeChange,
}: InspectorProps) {
    const availableTabs = useMemo(() => inspectorTabs.filter((tab) => !tab.devModeOnly || devMode), [devMode]);
    const [activeTab, setActiveTab] = useState<InspectorTab['id']>(() =>
        resolveInspectorTabId(availableTabs, initialTab ?? selectedTab),
    );
    const [markdownSettings, setMarkdownSettings] = useState(markdownPreferences);
    const tabsIdPrefix = `flowforge-inspector-tabs-${useId()}`;
    const getTabId = (id: string) => `${tabsIdPrefix}-tab-${id}`;
    const getPanelId = (id: string) => `${tabsIdPrefix}-panel-${id}`;

    // Reset the active tab
    useEffect(() => {
        if (availableTabs.some((tab) => tab.id === activeTab)) return;

        setActiveTab(resolveInspectorTabId(availableTabs, initialTab ?? selectedTab));
    }, [activeTab, availableTabs, initialTab, selectedTab]);

    const handleTabChange = (id: string) => {
        const tab = id as InspectorTab['id'];
        setActiveTab(tab);
        void onSelectedTabChange?.(tab);
    };

    const handleMarkdownSettingsChange = (settings: MarkdownPreferences) => {
        setMarkdownSettings(settings);
        void onMarkdownPreferencesChange?.(settings);
    };

    return (
        <section
            className="flowforge-inspector"
            aria-label="Page Inspector"
            aria-describedby="flowforge-inspector-subtitle"
            data-testid="flowforge-inspector"
        >
            <div className="flowforge-inspector__header">
                <div className="flowforge-inspector__header-main">
                    <p id="flowforge-inspector-subtitle" className="flowforge-inspector__header-subtitle">
                        Explore the current page's content and structure
                    </p>
                </div>
                <div className="flowforge-inspector__header-ctrl">
                    <Tooltip
                        content="Show enriched PageTrail records with raw fields, selectors, scores, and diagnostics."
                        variant="secondary"
                    >
                        <Switch
                            checked={devMode}
                            label="Dev mode"
                            variant="secondary"
                            onCheckedChange={onDevModeChange}
                        />
                    </Tooltip>
                </div>
            </div>
            <div className="flowforge-inspector__nav">
                <Tabs
                    tabs={availableTabs}
                    activeId={activeTab}
                    onChange={handleTabChange}
                    getTabId={getTabId}
                    getPanelId={getPanelId}
                    testIdPrefix="flowforge-inspector-tab"
                    autoFocus
                />
            </div>
            <div
                id={getPanelId(activeTab)}
                className={
                    activeTab === 'markdown'
                        ? 'flowforge-inspector__content flowforge-inspector__content--markdown'
                        : 'flowforge-inspector__content'
                }
                role="tabpanel"
                aria-labelledby={getTabId(activeTab)}
                data-testid="flowforge-inspector-panel"
            >
                {activeTab === 'basics' && <InspectorPageBasics basics={pageTrail.basics} />}
                {activeTab === 'structure' && (
                    <InspectorPageStructure structure={pageTrail.getStructureByImportanceDesc()} devMode={devMode} />
                )}
                {activeTab === 'content' && (
                    <InspectorPageContent content={pageTrail.getContentByImportanceDesc()} devMode={devMode} />
                )}
                {activeTab === 'interactive' && (
                    <InspectorPageInteractive
                        interactive={pageTrail.getInteractiveByImportanceDesc()}
                        devMode={devMode}
                    />
                )}
                {activeTab === 'markdown' && (
                    <InspectorPageMarkdown
                        pageTrail={pageTrail}
                        preferences={markdownSettings}
                        onPreferencesChange={handleMarkdownSettingsChange}
                    />
                )}
                {activeTab === 'metadata' && devMode && <InspectorPageMetadata metadata={pageTrail.metadata} />}
            </div>
            <div className="flowforge-inspector__footer">
                <InspectorLineMetadata metadata={pageTrail.metadata} />
            </div>
        </section>
    );
}
