import type { ComponentChildren } from 'preact';
import { forwardRef } from 'preact/compat';
import { useEffect, useId, useRef } from 'preact/hooks';
import type { LucideIcon } from 'lucide-preact';
import { Button } from '@/shared/components/Button';
import { Tooltip } from '@/shared/components/Tooltip';

interface TabButtonProps {
    tab: TabItem;
    tabId: string;
    panelId?: string;
    active: boolean;
    onSelect: () => void;
}

const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(function TabButton(
    { tab, tabId, panelId, active, onSelect },
    ref,
) {
    const classes = [
        'flowforge-tabs__tab',
        active && 'flowforge-tabs__tab--active',
        tab.disabled && 'flowforge-tabs__tab--disabled',
    ]
        .filter(Boolean)
        .join(' ');

    const button = (
        <Button
            ref={ref}
            id={tabId}
            size="small"
            variant="primary"
            icon={tab.icon}
            hollow
            className="flowforge-tabs__button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            disabled={tab.disabled}
            onClick={onSelect}
        >
            {tab.label}
        </Button>
    );

    return (
        <div className={classes}>
            {tab.tooltip ? (
                <Tooltip content={tab.tooltip} side="bottom" disabled={tab.disabled}>
                    {button}
                </Tooltip>
            ) : (
                button
            )}
        </div>
    );
});

export interface TabItem {
    id: string;
    label: ComponentChildren;
    icon?: LucideIcon;
    disabled?: boolean;
    tooltip?: ComponentChildren;
}

export interface TabsProps {
    tabs: readonly TabItem[];
    activeId: string;
    onChange: (id: string) => void;
    autoFocus?: boolean;
    getTabId?: (id: string) => string;
    getPanelId?: (id: string) => string;
}

export function Tabs({ tabs, activeId, onChange, autoFocus = false, getTabId, getPanelId }: TabsProps) {
    const fallbackIdPrefix = `flowforge-tabs-${useId()}`;
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
    const resolveTabId = getTabId ?? ((id: string) => `${fallbackIdPrefix}-tab-${id}`);

    useEffect(() => {
        if (!autoFocus) return;

        tabRefs.current[activeId]?.focus();
    }, [activeId, autoFocus]);

    const focusTab = (index: number) => {
        const tab = tabs[index];
        if (!tab || tab.disabled) return;

        onChange(tab.id);
        tabRefs.current[tab.id]?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const enabledTabs = tabs.map((tab, index) => ({ tab, index })).filter(({ tab }) => !tab.disabled);
        const currentEnabledIndex = enabledTabs.findIndex(({ tab }) => tab.id === activeId);

        if (currentEnabledIndex === -1) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            focusTab(enabledTabs[(currentEnabledIndex + 1) % enabledTabs.length]!.index);
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            focusTab(enabledTabs[(currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length]!.index);
        }
        if (e.key === 'Home') {
            e.preventDefault();
            focusTab(enabledTabs[0]!.index);
        }
        if (e.key === 'End') {
            e.preventDefault();
            focusTab(enabledTabs[enabledTabs.length - 1]!.index);
        }
    };

    return (
        <div className="flowforge-tabs" role="tablist" onKeyDown={handleKeyDown}>
            {tabs.map((tab, index) => {
                const isActive = index === activeIndex;

                return (
                    <TabButton
                        key={tab.id}
                        ref={(el: HTMLButtonElement | null) => {
                            tabRefs.current[tab.id] = el;
                        }}
                        tab={tab}
                        tabId={resolveTabId(tab.id)}
                        panelId={getPanelId?.(tab.id)}
                        active={isActive}
                        onSelect={() => onChange(tab.id)}
                    />
                );
            })}
        </div>
    );
}
