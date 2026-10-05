import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { FakeTransportService } from '../../../../../test/unit/fakes/FakeTransportService';
import { useInspectorPage, type UseInspectorPageOptions } from './useInspectorPage';

function PageHarness(options: UseInspectorPageOptions) {
    const { inspector } = useInspectorPage(options);

    return (
        <section>
            <div data-testid="inspector-tab">{inspector?.initialTab ?? ''}</div>
            <div data-testid="inspector-title">{inspector?.pageTrail.basics.title ?? ''}</div>
            <div data-testid="inspector-dev-mode">{String(inspector?.devMode)}</div>
            {inspector && (
                <>
                    <button type="button" onClick={inspector.close}>
                        Close inspector
                    </button>
                    <button type="button" onClick={() => void inspector.onDevModeChange(true)}>
                        Enable dev mode
                    </button>
                </>
            )}
        </section>
    );
}

describe('useInspectorPage', () => {
    it('opens the inspector with current page context and requested tab', async () => {
        // Given
        document.title = 'Inspectable Page';
        const transport = new FakeTransportService();
        const onDevModeChange = vi.fn();
        render(<PageHarness transport={transport} devMode={true} onDevModeChange={onDevModeChange} />);

        // When
        await expect(
            transport.dispatchToBackground({ type: 'OPEN_INSPECTOR', data: { tab: 'interactive' } }),
        ).resolves.toEqual({ success: true });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('inspector-tab').textContent).toBe('interactive');
            expect(screen.getByTestId('inspector-title').textContent).toBe('Inspectable Page');
            expect(screen.getByTestId('inspector-dev-mode').textContent).toBe('true');
        });
        fireEvent.click(screen.getByRole('button', { name: 'Enable dev mode' }));
        expect(onDevModeChange).toHaveBeenCalledWith(true);
    });

    it('closes the inspector through its view model', async () => {
        // Given
        const transport = new FakeTransportService();
        render(<PageHarness transport={transport} devMode={false} onDevModeChange={vi.fn()} />);
        await transport.dispatchToBackground({ type: 'OPEN_INSPECTOR', data: {} });
        await screen.findByRole('button', { name: 'Close inspector' });

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Close inspector' }));

        // Then
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Close inspector' })).toBeNull());
    });

    it('clears an open inspector on CLEAR_PAGE', async () => {
        // Given
        const transport = new FakeTransportService();
        render(<PageHarness transport={transport} devMode={false} onDevModeChange={vi.fn()} />);
        await transport.dispatchToBackground({ type: 'OPEN_INSPECTOR', data: { tab: 'content' } });
        await screen.findByRole('button', { name: 'Close inspector' });

        // When
        await expect(transport.dispatchToBackground({ type: 'CLEAR_PAGE' })).resolves.toEqual({ success: true });

        // Then
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Close inspector' })).toBeNull());
    });

    it('unregisters the page listener on unmount', async () => {
        // Given
        const transport = new FakeTransportService();
        const view = render(<PageHarness transport={transport} devMode={false} onDevModeChange={vi.fn()} />);

        // When
        view.unmount();

        // Then
        await expect(transport.dispatchToBackground({ type: 'CLEAR_PAGE' })).rejects.toThrow(
            'Message handler is not registered',
        );
    });
});
