import { createPageTrailFixture } from '@flowforge/page-trail/testing';
import { render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import type { PageInspectorDataBackgroundClient } from '@/background';
import { SidePanelApp } from './SidePanelApp';

function createClient() {
    const backgroundClient: PageInspectorDataBackgroundClient = {
        getPageInspectorData: vi
            .fn()
            .mockResolvedValue(createPageTrailFixture({ basics: { title: 'Inspector test page' } }).toDto()),
    };
    return backgroundClient;
}

describe('SidePanelApp', () => {
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
});
