import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import { config } from '@/config';
import type { Message } from '@/types';
import { FakeTransportService } from '../../../../../../test/unit/fakes/FakeTransportService';
import { useInspectorPopup, type UseInspectorPopupOptions } from './useInspectorPopup';

function PopupHarness({ transport }: UseInspectorPopupOptions) {
    const popup = useInspectorPopup({ transport });

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
        const transport = new FakeTransportService({ activeSenderId: 42 });
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            return { success: true };
        });

        // When
        render(<PopupHarness transport={transport} />);

        // Then
        await waitFor(() => {
            expect(messages).toEqual([{ type: 'POPUP_INITIALISE', senderId: 42 }]);
        });
        expect(screen.getByTestId('website').textContent).toBe(config.website);
        expect(screen.getByTestId('github').textContent).toBe(config.github);
        expect(screen.getByTestId('copyright').textContent).toBe(config.copyright);
    });

    it('opens the inspector with the active sender and optional tab', async () => {
        // Given
        const transport = new FakeTransportService({ activeSenderId: 42 });
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            return { success: true };
        });
        render(<PopupHarness transport={transport} />);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Open inspector' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open interactive tab' }));

        // Then
        await waitFor(() => {
            expect(messages.filter((message) => message.type === 'OPEN_PAGE_INSPECTOR')).toEqual([
                { type: 'OPEN_PAGE_INSPECTOR', senderId: 42, data: { tab: undefined } },
                { type: 'OPEN_PAGE_INSPECTOR', senderId: 42, data: { tab: 'interactive' } },
            ]);
        });
    });

    it('keeps the popup usable when initialization fails', async () => {
        // Given
        const transport = new FakeTransportService({ activeSenderId: 42 });
        const messages: Message[] = [];
        transport.addMessageListener((message) => {
            messages.push(message);
            if (message.type === 'POPUP_INITIALISE') throw new Error('Page unavailable');
            return { success: true };
        });
        render(<PopupHarness transport={transport} />);
        await waitFor(() => expect(messages[0]?.type).toBe('POPUP_INITIALISE'));

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Open inspector' }));

        // Then
        await waitFor(() => {
            expect(messages).toContainEqual({ type: 'OPEN_PAGE_INSPECTOR', senderId: 42, data: { tab: undefined } });
        });
    });
});
