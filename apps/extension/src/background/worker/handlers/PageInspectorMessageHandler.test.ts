import { describe, expect, it, vi } from 'vitest';

import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { PageClient } from '@/page/client/PageClient';
import type { OpenPageInspectorMessage } from '@/messaging';
import { PageInspectorMessageHandler } from './PageInspectorMessageHandler';
import { BackgroundWorker } from '../BackgroundWorker';

describe('PageInspectorMessageHandler', () => {
    it('routes an Inspector snapshot request through the worker to the selected page', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 1 });
        const snapshot = createPageTrailDtoFixture();
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: snapshot });
        const worker = new BackgroundWorker(transport, [new PageInspectorMessageHandler(new PageClient(transport))]);
        worker.start();

        // When
        const response = await transport.dispatchToBackground({ type: 'GET_PAGE_INSPECTOR_DATA' }, { pageId: 7 });

        // Then
        expect(response).toEqual({ success: true, data: snapshot });
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'COLLECT_PAGE_TRAIL', data: { contextOnly: true } } },
        ]);
        worker.stop();
    });

    it('collects the Inspector snapshot from the page in the message context', async () => {
        // Given
        const transport = new FakeTransportService();
        const snapshot = createPageTrailDtoFixture();
        transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: snapshot });
        const handler = new PageInspectorMessageHandler(new PageClient(transport));

        // When
        const result = await handler.handleGetPageInspectorData({ type: 'GET_PAGE_INSPECTOR_DATA' }, { pageId: 7 });

        // Then
        expect(result).toEqual(snapshot);
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'COLLECT_PAGE_TRAIL', data: { contextOnly: true } } },
        ]);
    });

    it('clears the page before opening the requested inspector tab', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new PageInspectorMessageHandler(new PageClient(transport));
        const message: OpenPageInspectorMessage = {
            type: 'OPEN_PAGE_INSPECTOR',
            data: { tab: 'semantic' },
        };

        // When
        const response = await handler.handleOpenPageInspector(message, { pageId: 7 });

        // Then
        expect(response).toBeUndefined();
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            { pageId: 7, message: { type: 'OPEN_INSPECTOR', data: { tab: 'semantic' } } },
        ]);
    });

    it('does not open the inspector if clearing the page fails', async () => {
        // Given
        const transport = new FakeTransportService();
        const error = new Error('Page unavailable');
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.spyOn(transport, 'sendToPage').mockRejectedValue(error);
        const handler = new PageInspectorMessageHandler(new PageClient(transport));
        const message: OpenPageInspectorMessage = {
            type: 'OPEN_PAGE_INSPECTOR',
            data: {},
        };

        // When / Then
        await expect(handler.handleOpenPageInspector(message, { pageId: 7 })).rejects.toThrow('Page unavailable');
        expect(transport.sendToPage).toHaveBeenCalledOnce();
        expect(transport.sendToPage).toHaveBeenCalledWith(7, { type: 'CLEAR_PAGE' });
    });
});
