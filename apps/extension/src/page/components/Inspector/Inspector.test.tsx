import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { createPageTrailFixture } from '../../../../test/fixtures.ts';
import { Inspector } from './Inspector';

const pageTrail = createPageTrailFixture({
    basics: {
        url: 'https://app.flowforge.test/settings',
        title: 'Settings page',
        description: 'Account settings',
        language: 'en',
        viewport: {
            width: 1280,
            height: 720,
            scrollY: 0,
            scrollHeight: 720,
        },
    },
    metadata: {
        structureElements: 1,
        structureMaxDepth: 1,
        contentElements: 2,
        contentElementsTotal: 2,
        contentElementsLimitReached: false,
        interactiveElements: 3,
        interactiveElementsTotal: 3,
        interactiveElementsLimitReached: false,
        collectedAt: 0,
        performance: {
            basicsMs: 1,
            structureMs: 2,
            contentMs: 3,
            interactiveMs: 4,
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
});
