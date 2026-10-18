import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it, vi } from 'vitest';

import { BackgroundWorker } from '@/background/worker/BackgroundWorker';
import { PageClient } from '@/page/client/PageClient';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import type { SidePanelClient } from './SidePanelClient';
import { InspectorSidePanelMessageHandler } from './InspectorSidePanelMessageHandler';

describe('InspectorSidePanelMessageHandler', () => {
    it('retries a refresh until the newly opened panel starts listening', async () => {
        const transport = new FakeTransportService();
        const sidePanel: SidePanelClient = {
            prepare: vi.fn(),
            open: vi.fn().mockResolvedValue(undefined),
            notifyRefresh: vi.fn().mockRejectedValueOnce(new Error('No listener')).mockResolvedValue(undefined),
        };
        const handler = new InspectorSidePanelMessageHandler(sidePanel, new PageClient(transport));

        await handler.handleOpenPageInspector(
            { type: 'OPEN_PAGE_INSPECTOR', data: { tab: 'markdown' } },
            { pageId: 7 },
        );

        await vi.waitFor(() => expect(sidePanel.notifyRefresh).toHaveBeenCalledTimes(2));
        expect(sidePanel.notifyRefresh).toHaveBeenLastCalledWith(7, 'markdown');
    });

    it('prepares and opens the tab-specific panel', async () => {
        const transport = new FakeTransportService();
        const sidePanel: SidePanelClient = {
            prepare: vi.fn().mockResolvedValue(undefined),
            open: vi.fn().mockResolvedValue(undefined),
            notifyRefresh: vi.fn().mockResolvedValue(undefined),
        };
        const worker = new BackgroundWorker(transport, [
            new InspectorSidePanelMessageHandler(sidePanel, new PageClient(transport)),
        ]);
        worker.start();

        expect(await transport.dispatchToBackground({ type: 'PREPARE_PAGE_INSPECTOR' }, { pageId: 7 })).toEqual({
            success: true,
            data: 7,
        });
        expect(sidePanel.prepare).toHaveBeenCalledWith(7);
        expect(
            await transport.dispatchToBackground(
                { type: 'OPEN_PAGE_INSPECTOR', data: { tab: 'markdown' } },
                { pageId: 7 },
            ),
        ).toEqual({
            success: true,
        });
        expect(sidePanel.open).toHaveBeenCalledWith(7);
        expect(sidePanel.notifyRefresh).toHaveBeenCalledWith(7, 'markdown');
        expect(transport.getSentToPage()).toEqual([]);
        worker.stop();
    });

    it('collects context-only page data on request', async () => {
        const transport = new FakeTransportService();
        const snapshot = createPageTrailDtoFixture();
        transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: snapshot });
        const sidePanel: SidePanelClient = { prepare: vi.fn(), open: vi.fn(), notifyRefresh: vi.fn() };
        const worker = new BackgroundWorker(transport, [
            new InspectorSidePanelMessageHandler(sidePanel, new PageClient(transport)),
        ]);
        worker.start();

        expect(await transport.dispatchToBackground({ type: 'GET_PAGE_INSPECTOR_DATA' }, { pageId: 7 })).toEqual({
            success: true,
            data: snapshot,
        });
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'COLLECT_PAGE_TRAIL', data: { contextOnly: true } } },
        ]);
        worker.stop();
    });
});
