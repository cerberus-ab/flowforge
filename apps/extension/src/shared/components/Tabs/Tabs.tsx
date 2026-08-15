import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import type { LucideIcon } from 'lucide-preact';
import { Icon } from '@/shared/components/Icon';

export interface TabItem {
    id: string;
    label: ComponentChildren;
    icon?: LucideIcon;
    disabled?: boolean;
}

interface TabsProps {
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
        const enabledTabs = tabs
            .map((tab, index) => ({ tab, index }))
            .filter(({ tab }) => !tab.disabled);
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
                    <button
                        key={tab.id}
                        ref={(el) => {
                            tabRefs.current[tab.id] = el;
                        }}
                        id={resolveTabId(tab.id)}
                        type="button"
                        className={isActive ? 'flowforge-tabs__tab flowforge-tabs__tab--active' : 'flowforge-tabs__tab'}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={getPanelId?.(tab.id)}
                        tabIndex={isActive ? 0 : -1}
                        disabled={tab.disabled}
                        onClick={() => onChange(tab.id)}
                    >
                        <span className="flowforge-tabs__tab-label">
                            {tab.icon && <Icon icon={tab.icon} size="medium" />}
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
