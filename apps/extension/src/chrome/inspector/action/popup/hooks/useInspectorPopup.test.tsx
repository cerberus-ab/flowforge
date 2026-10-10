import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import { config } from '@/config';
import type { Message } from '@/messaging';
import { BackgroundClient } from '@/background';
import { FakeTransportService } from '../../../../../../test/unit/fakes/FakeTransportService';
import { useInspectorPopup, type UseInspectorPopupOptions } from './useInspectorPopup';

function PopupHarness(options: UseInspectorPopupOptions) {
    const popup = useInspectorPopup(options);

    return (
        <section>
            <div data-testid="website">{popup.website}</div>
            <div data-testid="github">{popup.github}</div>
            <div data-testid="copyright">{popup.copyright}</div>
            <button type="button" onClick={() => void popup.openPageInspector()}>
                Open inspector
            </button>
            <button type="button" onClick={() => void popup.openPageInspector('interactive')}>
                Open interactive tab
            </button>
        </section>
    );
}

describe('useInspectorPopup', () => {
    it('initializes the popup and exposes its links', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 42 });
        const backgroundClient = new BackgroundClient(transport);
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            return { success: true };
        });

        // When
        render(<PopupHarness backgroundClient={backgroundClient} />);

        // Then
        await waitFor(() => {
            expect(messages).toEqual([{ type: 'POPUP_OPENED' }]);
        });
        expect(screen.getByTestId('website').textContent).toBe(config.website);
        expect(screen.getByTestId('github').textContent).toBe(config.github);
        expect(screen.getByTestId('copyright').textContent).toBe(config.copyright);
    });

    it('opens the inspector with the active sender and optional tab', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 42 });
        const backgroundClient = new BackgroundClient(transport);
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            return { success: true };
        });
        render(<PopupHarness backgroundClient={backgroundClient} />);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Open inspector' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open interactive tab' }));

        // Then
        await waitFor(() => {
            expect(messages.filter((message) => message.type === 'OPEN_PAGE_INSPECTOR')).toEqual([
                { type: 'OPEN_PAGE_INSPECTOR', data: { tab: undefined } },
                { type: 'OPEN_PAGE_INSPECTOR', data: { tab: 'interactive' } },
            ]);
        });
    });

    it('keeps the popup usable when initialization fails', async () => {
        // Given
        const transport = new FakeTransportService({ activePageId: 42 });
        const backgroundClient = new BackgroundClient(transport);
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            if (message.type === 'POPUP_OPENED') throw new Error('Page unavailable');
            return { success: true };
        });
        render(<PopupHarness backgroundClient={backgroundClient} />);
        await waitFor(() => expect(messages[0]?.type).toBe('POPUP_OPENED'));

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Open inspector' }));

        // Then
        await waitFor(() => {
            expect(messages).toContainEqual({ type: 'OPEN_PAGE_INSPECTOR', data: { tab: undefined } });
        });
    });
});
