import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChromeSidePanelClient } from './SidePanelClient';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';

describe('ChromeSidePanelClient', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('configures a tab-specific panel and opens it for the same tab', async () => {
        const setOptions = vi.fn().mockResolvedValue(undefined);
        const open = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('chrome', { sidePanel: { setOptions, open } });

        const transport = new FakeTransportService();
        const sidePanel = new ChromeSidePanelClient('sidePanel/index.html', transport);
        await sidePanel.prepare(42);
        await sidePanel.open(42);
        await sidePanel.notifyRefresh(42);

        expect(setOptions).toHaveBeenCalledWith({
            tabId: 42,
            path: 'sidePanel/index.html?pageId=42',
            enabled: true,
        });
        expect(open).toHaveBeenCalledWith({ tabId: 42 });
        expect(transport.getSentToSidePanel()).toEqual([
            { message: { type: 'REFRESH_PAGE_INSPECTOR' }, context: { pageId: 42 } },
        ]);
    });
});
