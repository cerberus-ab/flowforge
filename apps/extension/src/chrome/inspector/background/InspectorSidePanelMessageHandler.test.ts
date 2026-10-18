import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it, vi } from 'vitest';

import { BackgroundWorker } from '@/background/worker/BackgroundWorker';
import { PageClient } from '@/page/client/PageClient';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import type { SidePanelClient } from './SidePanelClient';
import { InspectorSidePanelMessageHandler } from './InspectorSidePanelMessageHandler';

describe('InspectorSidePanelMessageHandler', () => {
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
        expect(await transport.dispatchToBackground({ type: 'OPEN_PAGE_INSPECTOR', data: {} }, { pageId: 7 })).toEqual({
            success: true,
        });
        expect(sidePanel.open).toHaveBeenCalledWith(7);
        expect(sidePanel.notifyRefresh).toHaveBeenCalledWith(7);
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
