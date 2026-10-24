import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it, vi } from 'vitest';

import { BackgroundWorker } from '@/background/worker/BackgroundWorker';
import { PageClient } from '@/page/client/PageClient';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import type { SidePanelInspectorClient } from '@/sidePanel/client/contract';
import { SidePanelMessageHandler } from './SidePanelMessageHandler';

describe('SidePanelMessageHandler', () => {
    it('retries a refresh until the newly opened panel starts listening', async () => {
        const transport = new FakeTransportService();
        const sidePanel: SidePanelInspectorClient = {
            prepareForPage: vi.fn(),
            openForPage: vi.fn().mockResolvedValue(undefined),
            notifyPageInspectorRefresh: vi
                .fn()
                .mockRejectedValueOnce(new Error('No listener'))
                .mockResolvedValue(undefined),
        };
        const handler = new SidePanelMessageHandler(sidePanel, new PageClient(transport));

        await handler.handleOpenPageInspector(
            { type: 'OPEN_PAGE_INSPECTOR', data: { tab: 'markdown' } },
            { pageId: 7 },
        );

        await vi.waitFor(() => expect(sidePanel.notifyPageInspectorRefresh).toHaveBeenCalledTimes(2));
        expect(sidePanel.notifyPageInspectorRefresh).toHaveBeenLastCalledWith(7, 'markdown');
    });

    it('prepares and opens the tab-specific panel', async () => {
        const transport = new FakeTransportService();
        const sidePanel: SidePanelInspectorClient = {
            prepareForPage: vi.fn().mockResolvedValue(undefined),
            openForPage: vi.fn().mockResolvedValue(undefined),
            notifyPageInspectorRefresh: vi.fn().mockResolvedValue(undefined),
        };
        const worker = new BackgroundWorker(transport, [
            new SidePanelMessageHandler(sidePanel, new PageClient(transport)),
        ]);
        worker.start();

        expect(await transport.dispatchToBackground({ type: 'PREPARE_PAGE_INSPECTOR' }, { pageId: 7 })).toEqual({
            success: true,
            data: 7,
        });
        expect(sidePanel.prepareForPage).toHaveBeenCalledWith(7);
        expect(
            await transport.dispatchToBackground(
                { type: 'OPEN_PAGE_INSPECTOR', data: { tab: 'markdown' } },
                { pageId: 7 },
            ),
        ).toEqual({
            success: true,
        });
        expect(sidePanel.openForPage).toHaveBeenCalledWith(7);
        expect(sidePanel.notifyPageInspectorRefresh).toHaveBeenCalledWith(7, 'markdown');
        expect(transport.getSentToPage()).toEqual([]);
        worker.stop();
    });

    it('collects context-only page data on request', async () => {
        const transport = new FakeTransportService();
        const snapshot = createPageTrailDtoFixture();
        transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: snapshot });
        const sidePanel: SidePanelInspectorClient = {
            prepareForPage: vi.fn(),
            openForPage: vi.fn(),
            notifyPageInspectorRefresh: vi.fn(),
        };
        const worker = new BackgroundWorker(transport, [
            new SidePanelMessageHandler(sidePanel, new PageClient(transport)),
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
