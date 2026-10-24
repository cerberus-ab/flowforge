import { createPageTrailFixture } from '@flowforge/page-trail/testing';
import { PageTrail } from '@flowforge/page-trail';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Inspector } from './Inspector';
import type { InspectorTabId } from '@/shared/types/inspector';
import type { MarkdownPreferences } from '@/shared/types/settings';

const pageTrail = createPageTrailFixture({
    basics: {
        title: 'Settings page',
    },
    metadata: {
        elements: {
            contentElements: 2,
            interactiveElements: 3,
        },
        performance: {
            totalMs: 10,
        },
    },
});

function renderInspector({
    initialTab,
    devMode = false,
    onDevModeChange = vi.fn(),
    selectedTab,
    markdownPreferences,
    onSelectedTabChange,
    onMarkdownPreferencesChange,
}: {
    initialTab?: string;
    devMode?: boolean;
    onDevModeChange?: (enabled: boolean) => void;
    selectedTab?: InspectorTabId;
    markdownPreferences?: MarkdownPreferences;
    onSelectedTabChange?: (tab: InspectorTabId) => void;
    onMarkdownPreferencesChange?: (preferences: MarkdownPreferences) => void;
} = {}) {
    render(
        <Inspector
            pageTrail={pageTrail}
            initialTab={initialTab}
            selectedTab={selectedTab}
            markdownPreferences={markdownPreferences}
            onSelectedTabChange={onSelectedTabChange}
            onMarkdownPreferencesChange={onMarkdownPreferencesChange}
            devMode={devMode}
            onDevModeChange={onDevModeChange}
        />,
    );

    return { onDevModeChange };
}

describe('Inspector', () => {
    it('renders a PageTrail restored from a transferred DTO', () => {
        // Given
        const restoredTrail = PageTrail.fromDto(pageTrail.toDto());

        // When
        render(<Inspector pageTrail={restoredTrail} devMode={false} onDevModeChange={vi.fn()} />);

        // Then
        expect(screen.getByText('"Settings page"')).toBeTruthy();
    });

    it('opens on the requested tab and switches tabs', async () => {
        // Given / When
        renderInspector({ initialTab: 'interactive' });

        // Then
        expect(screen.getByRole('region', { name: 'Page Inspector' })).toBeTruthy();
        expect(screen.getByText("Explore the current page's content and structure")).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Interactive' }).getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('Selected 2 content elements, 3 interactive elements · 10ms')).toBeTruthy();

        // When
        fireEvent.click(screen.getByRole('tab', { name: 'Basics' }));

        // Then
        await waitFor(() => {
            expect(screen.getByRole('tab', { name: 'Basics' }).getAttribute('aria-selected')).toBe('true');
        });
        expect(screen.getByText('"Settings page"')).toBeTruthy();
    });

    it('uses the saved tab when no initial tab is requested', () => {
        // Given / When
        renderInspector({ selectedTab: 'interactive' });

        // Then
        expect(screen.getByRole('tab', { name: 'Interactive' }).getAttribute('aria-selected')).toBe('true');
    });

    it('lets an explicitly requested tab override the saved tab', () => {
        // Given / When
        renderInspector({ initialTab: 'markdown', selectedTab: 'interactive' });

        // Then
        expect(screen.getByRole('tab', { name: 'Markdown' }).getAttribute('aria-selected')).toBe('true');
    });

    it('shows metadata only in dev mode and forwards dev mode changes', () => {
        // Given
        const onDevModeChange = vi.fn();

        // When
        renderInspector({ devMode: true, onDevModeChange });

        // Then
        expect(screen.getByRole('tab', { name: 'Metadata' })).toBeTruthy();

        // When
        fireEvent.click(screen.getByRole('switch', { name: 'Dev mode' }));

        // Then
        expect(onDevModeChange).toHaveBeenCalledWith(false);
    });

    it('configures the Markdown preview with blocks and detail level', () => {
        // Given
        const onMarkdownPreferencesChange = vi.fn();
        renderInspector({
            initialTab: 'markdown',
            markdownPreferences: { detailLevel: 'compact', blocks: ['structure', 'interactive', 'content'] },
            onMarkdownPreferencesChange,
        });

        // Then
        const detailLevel = screen.getByLabelText('Detail level') as HTMLSelectElement;
        const basics = screen.getByRole('switch', { name: 'Basics' });
        const markdownViewer = screen.getByTestId('flowforge-markdown-viewer');
        expect(detailLevel.value).toBe('compact');
        expect(basics.getAttribute('aria-checked')).toBe('false');
        expect(basics.classList.contains('flowforge-switch--wide')).toBe(true);
        expect(markdownViewer.textContent).not.toContain('## Basics');
        expect(screen.getByText(/Compact: A short overview with the most important page details\./)).toBeTruthy();
        expect(screen.getByText('The page title, URL, description, language, and current viewport.')).toBeTruthy();

        const tokenStat = screen.getByTestId('flowforge-markdown-stat-tokens');
        expect(tokenStat.textContent).toContain('Estimated tokens');
        expect(tokenStat.textContent).toMatch(/~\d+/);
        expect(tokenStat.querySelector('.flowforge-inspector-page-markdown__size-track')?.className).toContain(
            '--transparent',
        );
        expect(screen.getByText('Size by characters')).toBeTruthy();

        // When
        fireEvent.click(screen.getByRole('switch', { name: 'Structure' }));

        // Then
        expect(screen.getByRole('switch', { name: 'Structure' }).getAttribute('aria-checked')).toBe('false');
        expect((screen.getByLabelText('Detail level') as HTMLSelectElement).value).toBe('compact');
        expect(screen.getByTestId('flowforge-markdown-viewer').textContent).not.toContain('## Basics');
        expect(onMarkdownPreferencesChange).toHaveBeenLastCalledWith({
            detailLevel: 'compact',
            blocks: ['interactive', 'content'],
        });

        // When
        fireEvent.click(screen.getByRole('tab', { name: 'Basics' }));
        fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));

        // Then
        expect((screen.getByLabelText('Detail level') as HTMLSelectElement).value).toBe('compact');
        expect(screen.getByRole('switch', { name: 'Basics' }).getAttribute('aria-checked')).toBe('false');
        expect(screen.getByRole('switch', { name: 'Structure' }).getAttribute('aria-checked')).toBe('false');
        expect(onMarkdownPreferencesChange).toHaveBeenLastCalledWith({
            detailLevel: 'compact',
            blocks: ['interactive', 'content'],
        });
    });
});
