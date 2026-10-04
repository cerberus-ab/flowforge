import { createPageTrailFixture } from '@flowforge/page-trail/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Inspector } from './Inspector';

const pageTrail = createPageTrailFixture({
    basics: {
        title: 'Settings page',
    },
    metadata: {
        contentElements: 2,
        interactiveElements: 3,
        performance: {
            totalMs: 10,
        },
    },
});

function renderInspector({
    initialTab,
    devMode = false,
    close = vi.fn(),
    onDevModeChange = vi.fn(),
}: {
    initialTab?: string;
    devMode?: boolean;
    close?: () => void;
    onDevModeChange?: (enabled: boolean) => void;
} = {}) {
    render(
        <Inspector
            pageTrail={pageTrail}
            initialTab={initialTab}
            close={close}
            devMode={devMode}
            onDevModeChange={onDevModeChange}
        />,
    );

    return { close, onDevModeChange };
}

describe('Inspector', () => {
    it('opens on the requested tab and switches tabs', async () => {
        // Given / When
        renderInspector({ initialTab: 'interactive' });

        // Then
        expect(screen.getByRole('dialog', { name: 'Inspect page context' })).toBeTruthy();
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

    it('closes from button, escape, and backdrop click', () => {
        // Given
        const close = vi.fn();
        renderInspector({ close });

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        fireEvent.keyDown(document, { key: 'Escape' });
        fireEvent.pointerDown(document.querySelector('.flowforge-inspector-container')!);

        // Then
        expect(close).toHaveBeenCalledTimes(3);
    });

    it('configures the Markdown preview with blocks and detail level', () => {
        // Given
        renderInspector({ initialTab: 'markdown' });

        // Then
        const detailLevel = screen.getByLabelText('Detail level') as HTMLSelectElement;
        const basics = screen.getByRole('switch', { name: 'Basics' });
        const markdownViewer = screen.getByTestId('flowforge-markdown-viewer');
        expect(detailLevel.value).toBe('standard');
        expect(basics.getAttribute('aria-checked')).toBe('true');
        expect(basics.classList.contains('flowforge-switch--wide')).toBe(true);
        expect(markdownViewer.textContent).toContain('## Basics');
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
        fireEvent.click(basics);
        fireEvent.change(detailLevel, { target: { value: 'compact' } });

        // Then
        expect(basics.getAttribute('aria-checked')).toBe('false');
        expect(detailLevel.value).toBe('compact');
        expect(markdownViewer.textContent).not.toContain('## Basics');
    });
});
