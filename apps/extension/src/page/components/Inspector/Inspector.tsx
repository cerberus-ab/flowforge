import type { TargetedPointerEvent } from 'preact';
import { useEffect, useId, useState } from 'preact/hooks';
import { BadgeInfo, BookOpenText, ChartNoAxesColumn, FileText, ListTree, MousePointerClick } from 'lucide-preact';
import { getEventTarget } from '@/core/utils/dom';
import type { InspectorViewModel } from '@/page/hooks/usePage';
import { Button } from '@/shared/components/Button';
import { JsonViewer } from '@/shared/components/JsonViewer';
import { MarkdownViewer } from '@/shared/components/MarkdownViewer';
import { Tabs } from '@/shared/components/Tabs';
import { InspectorPageMetadata } from '@/page/components/Inspector/components/Metadata';
import { semMarkdown } from '@flowforge/page-trail';
import {
    InspectorPageContainer,
    InspectorPageContent,
    InspectorPageInteractive,
} from '@/page/components/Inspector/components/Elements';

const inspectorTabs = [
    { id: 'basics', label: 'Basics', icon: BadgeInfo },
    { id: 'container', label: 'Container', icon: ListTree },
    { id: 'content', label: 'Content', icon: BookOpenText },
    { id: 'interactive', label: 'Interactive', icon: MousePointerClick },
    { id: 'semanticView', label: 'Semantic view', icon: FileText },
    { id: 'metadata', label: 'Metadata', icon: ChartNoAxesColumn },
] as const;

type InspectorTabId = (typeof inspectorTabs)[number]['id'];

export function Inspector({ pageTrail, close }: InspectorViewModel) {
    const [activeTab, setActiveTab] = useState<InspectorTabId>('basics');
    const tabsIdPrefix = `flowforge-inspector-tabs-${useId()}`;
    const getTabId = (id: string) => `${tabsIdPrefix}-tab-${id}`;
    const getPanelId = (id: string) => `${tabsIdPrefix}-panel-${id}`;

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
                        <Button variant="secondary" size="small" onClick={close}>
                            Close
                        </Button>
                    </div>
                </div>
                <div className="flowforge-inspector__nav">
                    <Tabs
                        tabs={inspectorTabs}
                        activeId={activeTab}
                        onChange={(id) => setActiveTab(id as InspectorTabId)}
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
                    {activeTab === 'container' && <InspectorPageContainer container={pageTrail.container} />}
                    {activeTab === 'content' && <InspectorPageContent content={pageTrail.content} />}
                    {activeTab === 'interactive' && <InspectorPageInteractive interactive={pageTrail.interactive} />}
                    {activeTab === 'semanticView' && <MarkdownViewer value={semMarkdown(pageTrail)} />}
                    {activeTab === 'metadata' && <JsonViewer value={pageTrail.metadata} sortKeys />}
                </div>
                <div className="flowforge-inspector__footer">
                    <InspectorPageMetadata metadata={pageTrail.metadata} />
                </div>
            </div>
        </div>
    );
}
