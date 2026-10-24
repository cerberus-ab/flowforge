import { afterEach, describe, expect, it, vi } from 'vitest';

import { SidePanelClient } from './SidePanelClient';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';

describe('SidePanelClient', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('configures a tab-specific panel and opens it for the same tab', async () => {
        const setOptions = vi.fn().mockResolvedValue(undefined);
        const open = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('chrome', { sidePanel: { setOptions, open } });

        const transport = new FakeTransportService();
        const sidePanel = new SidePanelClient('sidePanel/index.html', transport);
        await sidePanel.prepareForPage(42);
        await sidePanel.openForPage(42);
        await sidePanel.notifyPageInspectorRefresh(42, 'markdown');

        expect(setOptions).toHaveBeenCalledWith({
            tabId: 42,
            path: 'sidePanel/index.html?pageId=42',
            enabled: true,
        });
        expect(open).toHaveBeenCalledWith({ tabId: 42 });
        expect(transport.getSentToSidePanel()).toEqual([
            { message: { type: 'REFRESH_PAGE_INSPECTOR', data: { tab: 'markdown' } }, context: { pageId: 42 } },
        ]);
    });

    it('rejects an unsuccessful Inspector refresh response', async () => {
        const transport = new FakeTransportService();
        transport.addMessageListener(() => ({ success: false, error: 'Panel refresh failed' }));

        await expect(
            new SidePanelClient('sidePanel/index.html', transport).notifyPageInspectorRefresh(42),
        ).rejects.toThrow('Panel refresh failed');
    });
});
