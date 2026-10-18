import { createPageTrailFixture } from '@flowforge/page-trail/testing';
import type { PageTrailDto } from '@flowforge/contract';
import { act, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SidePanelBackgroundClient } from '@/background';
import { SidePanelApp } from './SidePanelApp';

function createClient() {
    const backgroundClient: SidePanelBackgroundClient = {
        getPageInspectorData: vi
            .fn()
            .mockResolvedValue(createPageTrailFixture({ basics: { title: 'Inspector test page' } }).toDto()),
        subscribeToSidePanelMessages: vi.fn().mockReturnValue(() => undefined),
    };
    return backgroundClient;
}

describe('SidePanelApp', () => {
    let onTabUpdated: (tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => void;

    beforeEach(() => {
        vi.stubGlobal('chrome', {
            tabs: {
                onUpdated: {
                    addListener: vi.fn((listener) => {
                        onTabUpdated = listener;
                    }),
                    removeListener: vi.fn(),
                },
            },
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('requests fresh page data for its tab and renders the shared Inspector', async () => {
        const backgroundClient = createClient();

        render(
            <SidePanelApp backgroundClient={backgroundClient} pageId={42} devMode={false} onDevModeChange={vi.fn()} />,
        );

        expect(await screen.findByText('"Inspector test page"')).toBeTruthy();
        expect(backgroundClient.getPageInspectorData).toHaveBeenCalledWith(42);
        expect(screen.getByRole('region', { name: 'Inspect page context' })).toBeTruthy();
    });

    it('shows an instruction instead of requesting data without a tab', () => {
        const backgroundClient = createClient();

        render(
            <SidePanelApp
                backgroundClient={backgroundClient}
                pageId={null}
                devMode={false}
                onDevModeChange={vi.fn()}
            />,
        );

        expect(screen.getByText('Open Page Inspector from its extension popup.')).toBeTruthy();
        expect(backgroundClient.getPageInspectorData).not.toHaveBeenCalled();
    });

    it('shows a collection error', async () => {
        const backgroundClient = createClient();
        vi.mocked(backgroundClient.getPageInspectorData).mockRejectedValue(new Error('Unavailable'));

        render(
            <SidePanelApp backgroundClient={backgroundClient} pageId={42} devMode={false} onDevModeChange={vi.fn()} />,
        );

        expect(await screen.findByRole('alert')).toBeTruthy();
    });

    it('invalidates on navigation and collects only from its bound tab', async () => {
        const backgroundClient = createClient();
        const nextTrail = createPageTrailFixture({ basics: { title: 'Next page' } }).toDto();
        vi.mocked(backgroundClient.getPageInspectorData)
            .mockResolvedValueOnce(createPageTrailFixture({ basics: { title: 'First page' } }).toDto())
            .mockResolvedValue(nextTrail);
        render(
            <SidePanelApp backgroundClient={backgroundClient} pageId={42} devMode={false} onDevModeChange={vi.fn()} />,
        );
        expect(await screen.findByText('"First page"')).toBeTruthy();

        act(() => onTabUpdated(7, { status: 'complete' }));
        expect(backgroundClient.getPageInspectorData).toHaveBeenCalledTimes(1);

        act(() => onTabUpdated(42, { status: 'loading' }));
        expect(screen.getByText('Loading page data…')).toBeTruthy();
        act(() => onTabUpdated(42, { status: 'complete' }));

        expect(await screen.findByText('"Next page"')).toBeTruthy();
        expect(backgroundClient.getPageInspectorData).toHaveBeenCalledTimes(2);
    });

    it('refreshes when background reports that the panel was reopened', async () => {
        const backgroundClient = createClient();
        const nextTrail = createPageTrailFixture({ basics: { title: 'Updated page' } }).toDto();
        render(
            <SidePanelApp backgroundClient={backgroundClient} pageId={42} devMode={false} onDevModeChange={vi.fn()} />,
        );
        expect(await screen.findByText('"Inspector test page"')).toBeTruthy();
        vi.mocked(backgroundClient.getPageInspectorData).mockResolvedValue(nextTrail);
        const [, callbacks] = vi.mocked(backgroundClient.subscribeToSidePanelMessages).mock.calls[0]!;

        act(() => callbacks.onRefreshPageInspector('markdown'));

        await waitFor(() =>
            expect(screen.getByTestId('flowforge-inspector-tab-markdown').getAttribute('aria-selected')).toBe('true'),
        );
        expect(backgroundClient.getPageInspectorData).toHaveBeenCalledTimes(2);
    });

    it('retries after navigation until the new content script is ready', async () => {
        const backgroundClient = createClient();
        vi.mocked(backgroundClient.getPageInspectorData).mockRejectedValueOnce(new Error('No listener'));

        render(
            <SidePanelApp backgroundClient={backgroundClient} pageId={42} devMode={false} onDevModeChange={vi.fn()} />,
        );

        expect(await screen.findByText('"Inspector test page"')).toBeTruthy();
        expect(backgroundClient.getPageInspectorData).toHaveBeenCalledTimes(2);
    });

    it('ignores a response from the page before navigation', async () => {
        const backgroundClient = createClient();
        const oldTrail = createPageTrailFixture({ basics: { title: 'Old page' } }).toDto();
        const newTrail = createPageTrailFixture({ basics: { title: 'New page' } }).toDto();
        let finishOldRequest: (() => void) | undefined;
        vi.mocked(backgroundClient.getPageInspectorData)
            .mockImplementationOnce(
                () =>
                    new Promise<PageTrailDto>((resolve) => {
                        finishOldRequest = () => resolve(oldTrail);
                    }),
            )
            .mockResolvedValue(newTrail);
        render(
            <SidePanelApp backgroundClient={backgroundClient} pageId={42} devMode={false} onDevModeChange={vi.fn()} />,
        );
        await waitFor(() => expect(backgroundClient.getPageInspectorData).toHaveBeenCalledOnce());

        act(() => onTabUpdated(42, { status: 'complete' }));
        expect(await screen.findByText('"New page"')).toBeTruthy();
        await act(async () => {
            finishOldRequest?.();
        });

        expect(screen.getByText('"New page"')).toBeTruthy();
        expect(screen.queryByText('"Old page"')).toBeNull();
    });
});
