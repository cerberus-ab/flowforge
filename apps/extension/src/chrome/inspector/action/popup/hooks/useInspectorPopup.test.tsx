import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { config } from '@/config';
import type { InspectorPopupBackgroundClient } from '@/background';
import { useInspectorPopup } from './useInspectorPopup';

function PopupHarness({ backgroundClient }: { backgroundClient: InspectorPopupBackgroundClient }) {
    const popup = useInspectorPopup({ backgroundClient });

    return (
        <section>
            <div data-testid="website">{popup.website}</div>
            <div data-testid="github">{popup.github}</div>
            <div data-testid="copyright">{popup.copyright}</div>
            <button type="button" disabled={!popup.canOpen} onClick={() => void popup.openPageInspector()}>
                Open inspector
            </button>
            {popup.error && <p role="alert">{popup.error}</p>}
        </section>
    );
}

describe('useInspectorPopup', () => {
    it('prepares the active tab and opens the panel for that tab', async () => {
        const backgroundClient: InspectorPopupBackgroundClient = {
            preparePageInspector: vi.fn().mockResolvedValue(42),
            openPageInspectorForPage: vi.fn().mockResolvedValue(undefined),
        };

        render(<PopupHarness backgroundClient={backgroundClient} />);

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Open inspector' }).hasAttribute('disabled')).toBe(false),
        );
        expect(backgroundClient.preparePageInspector).toHaveBeenCalledOnce();
        expect(screen.getByTestId('website').textContent).toBe(config.website);
        expect(screen.getByTestId('github').textContent).toBe(config.github);
        expect(screen.getByTestId('copyright').textContent).toBe(config.copyright);

        fireEvent.click(screen.getByRole('button', { name: 'Open inspector' }));
        await waitFor(() => expect(backgroundClient.openPageInspectorForPage).toHaveBeenCalledWith(42));
    });

    it('keeps Open disabled if panel preparation fails', async () => {
        const backgroundClient: InspectorPopupBackgroundClient = {
            preparePageInspector: vi.fn().mockRejectedValue(new Error('Page unavailable')),
            openPageInspectorForPage: vi.fn(),
        };

        render(<PopupHarness backgroundClient={backgroundClient} />);

        await screen.findByRole('alert');
        expect(screen.getByRole('button', { name: 'Open inspector' }).hasAttribute('disabled')).toBe(true);
        expect(backgroundClient.openPageInspectorForPage).not.toHaveBeenCalled();
    });

    it('does not open the panel twice while an open request is pending', async () => {
        let finishOpen: (() => void) | undefined;
        const backgroundClient: InspectorPopupBackgroundClient = {
            preparePageInspector: vi.fn().mockResolvedValue(42),
            openPageInspectorForPage: vi.fn().mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        finishOpen = resolve;
                    }),
            ),
        };
        render(<PopupHarness backgroundClient={backgroundClient} />);
        const button = screen.getByRole('button', { name: 'Open inspector' });
        await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));

        fireEvent.click(button);
        fireEvent.click(button);

        expect(backgroundClient.openPageInspectorForPage).toHaveBeenCalledOnce();
        expect(button.hasAttribute('disabled')).toBe(true);
        finishOpen?.();
        await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
    });

    it('shows an error and allows retry after opening fails', async () => {
        const backgroundClient: InspectorPopupBackgroundClient = {
            preparePageInspector: vi.fn().mockResolvedValue(42),
            openPageInspectorForPage: vi
                .fn()
                .mockRejectedValueOnce(new Error('Unavailable'))
                .mockResolvedValue(undefined),
        };
        render(<PopupHarness backgroundClient={backgroundClient} />);
        const button = screen.getByRole('button', { name: 'Open inspector' });
        await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));

        fireEvent.click(button);
        expect(await screen.findByRole('alert')).toBeTruthy();
        fireEvent.click(button);

        await waitFor(() => expect(backgroundClient.openPageInspectorForPage).toHaveBeenCalledTimes(2));
    });
});
