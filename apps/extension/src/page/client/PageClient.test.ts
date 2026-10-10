import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it } from 'vitest';

import { createSettingsFixture } from '../../../test/fixtures';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { PageClient } from './PageClient';

const element = {
    text: 'Save',
    dataId: 'save-button',
    cssSelector: '#save',
    action: 'click',
} as const;

describe('PageClient', () => {
    it('sends typed commands to the requested page and unwraps their responses', async () => {
        // Given
        const pageTrailDto = createPageTrailDtoFixture();
        const settings = createSettingsFixture({ theme: 'dark' });
        const transport = new FakeTransportService({ pageHostname: 'app.flowforge.test' });
        transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: pageTrailDto });
        const client = new PageClient(transport);

        // When
        const hostname = await client.getHostname(7);
        await client.clearPage(7);
        const collectedPageTrail = await client.collectPageTrail(7);
        await client.highlightElement(7, element);
        await client.startOnboarding(7, {
            title: 'Saving',
            description: 'Click Save.',
            mode: 'direct',
            elements: [element],
        });
        await client.openInspector(7, 'semantic');
        await client.notifySettingsUpdated(7, settings);

        // Then
        expect(hostname).toBe('app.flowforge.test');
        expect(collectedPageTrail).toEqual(pageTrailDto);
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            { pageId: 7, message: { type: 'COLLECT_PAGE_TRAIL' } },
            { pageId: 7, message: { type: 'HIGHLIGHT_ELEMENT', data: { element } } },
            {
                pageId: 7,
                message: {
                    type: 'START_ONBOARDING',
                    data: {
                        title: 'Saving',
                        description: 'Click Save.',
                        mode: 'direct',
                        elements: [element],
                    },
                },
            },
            { pageId: 7, message: { type: 'OPEN_INSPECTOR', data: { tab: 'semantic' } } },
            { pageId: 7, message: { type: 'SETTINGS_UPDATED', data: settings } },
        ]);
    });

    it('throws page response errors', async () => {
        // Given
        const transport = new FakeTransportService();
        transport.setPageResponse('CLEAR_PAGE', { success: false, error: 'Page unavailable' });
        const client = new PageClient(transport);

        // When / Then
        await expect(client.clearPage(7)).rejects.toThrow('Page unavailable');
    });
});
