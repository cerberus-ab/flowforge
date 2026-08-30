import type { AgentResultElement, PageTrail } from '@flowforge/contract';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import type { MessageResponse } from '@/types';
import { FakeTransportService } from '../../../test/fakes/FakeTransportService';
import { usePage, type UsePageOptions } from './usePage';

const targetElement: AgentResultElement = {
    text: 'Settings',
    dataId: 'flowforge-settings',
    cssSelector: '#settings-button',
    action: 'click',
};

const secondaryElement: AgentResultElement = {
    text: 'Billing',
    dataId: 'flowforge-billing',
    cssSelector: '#billing-button',
    action: 'click',
};

function addTargetButton(element: AgentResultElement) {
    const button = document.createElement('button');
    button.id = element.cssSelector?.replace('#', '') ?? element.dataId;
    button.setAttribute('data-flowforge-id', element.dataId);
    button.textContent = element.text;
    document.body.append(button);
}

function PageHarness({ transport, devMode = false, onDevModeChange = () => undefined, onReady }: UsePageOptions) {
    const page = usePage({ transport, devMode, onDevModeChange, onReady });

    return (
        <section>
            <div data-testid="highlight-text">{page.highlights[0]?.element.text ?? ''}</div>
            <div data-testid="highlight-count">{page.highlights.length}</div>
            <div data-testid="wizard-title">{page.wizard?.title ?? ''}</div>
            <div data-testid="wizard-step">{page.wizard?.currentStep ?? 'none'}</div>
            {page.wizard && (
                <button type="button" onClick={() => page.wizard?.changeStep(1)}>
                    Show Step 1
                </button>
            )}
            <div data-testid="inspector-tab">{page.inspector?.initialTab ?? ''}</div>
            <div data-testid="inspector-title">{page.inspector?.pageTrail.basics.title ?? ''}</div>
        </section>
    );
}

function renderPage({ onReady }: Partial<Omit<UsePageOptions, 'transport'>> = {}) {
    const transport = new FakeTransportService();

    render(<PageHarness transport={transport} devMode={false} onDevModeChange={() => undefined} onReady={onReady} />);

    return { transport };
}

describe('usePage', () => {
    it('registers the page listener and collects the current page trail', async () => {
        // Given
        const onReady = vi.fn();
        document.title = 'FlowForge Page';
        addTargetButton(targetElement);
        const { transport } = renderPage({ onReady });

        // When
        const response = await transport.dispatchToBackground({
            type: 'COLLECT_PAGE_TRAIL',
        });

        // Then
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(response.success).toBe(true);
        expect((response as MessageResponse<PageTrail> & { success: true }).data.basics.title).toBe('FlowForge Page');
        expect((response as MessageResponse<PageTrail> & { success: true }).data.interactive.length).toBeGreaterThan(0);
    });

    it('shows a direct highlight for target messages', async () => {
        // Given
        addTargetButton(targetElement);
        const { transport } = renderPage();

        // When
        await transport.dispatchToBackground({
            type: 'HIGHLIGHT_ELEMENT',
            data: {
                element: targetElement,
            },
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('highlight-text').textContent).toBe('Settings');
            expect(screen.getByTestId('highlight-count').textContent).toBe('1');
        });
    });

    it('starts direct onboarding by highlighting the first element', async () => {
        // Given
        addTargetButton(targetElement);
        const { transport } = renderPage();

        // When
        await transport.dispatchToBackground({
            type: 'START_ONBOARDING',
            data: {
                title: 'Open settings',
                description: 'Use the sidebar.',
                mode: 'direct',
                elements: [targetElement],
            },
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('highlight-text').textContent).toBe('Settings');
            expect(screen.getByTestId('wizard-title').textContent).toBe('');
        });
    });

    it('starts wizard onboarding and highlights the selected step', async () => {
        // Given
        addTargetButton(targetElement);
        addTargetButton(secondaryElement);
        const { transport } = renderPage();

        // When
        await transport.dispatchToBackground({
            type: 'START_ONBOARDING',
            data: {
                title: 'Setup flow',
                description: 'Follow these steps.',
                mode: 'steps',
                elements: [targetElement, secondaryElement],
            },
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('wizard-title').textContent).toBe('Setup flow');
            expect(screen.getByTestId('wizard-step').textContent).toBe('0');
            expect(screen.getByTestId('highlight-count').textContent).toBe('0');
        });

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Show Step 1' }));

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('wizard-step').textContent).toBe('1');
            expect(screen.getByTestId('highlight-text').textContent).toBe('Settings');
        });
    });

    it('opens the inspector with a collected page trail', async () => {
        // Given
        document.title = 'Inspectable Page';
        const { transport } = renderPage();

        // When
        await transport.dispatchToBackground({
            type: 'OPEN_INSPECTOR',
            data: {
                tab: 'interactive',
            },
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('inspector-tab').textContent).toBe('interactive');
            expect(screen.getByTestId('inspector-title').textContent).toBe('Inspectable Page');
        });
    });

    it('clears wizard, highlights, and inspector state', async () => {
        // Given
        addTargetButton(targetElement);
        const { transport } = renderPage();
        await transport.dispatchToBackground({
            type: 'START_ONBOARDING',
            data: {
                title: 'Setup flow',
                description: 'Follow these steps.',
                mode: 'steps',
                elements: [targetElement],
            },
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Show Step 1' }));
        await transport.dispatchToBackground({
            type: 'OPEN_INSPECTOR',
            data: {
                tab: 'content',
            },
        });

        // When
        await transport.dispatchToBackground({
            type: 'CLEAR_PAGE',
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('wizard-title').textContent).toBe('');
            expect(screen.getByTestId('highlight-count').textContent).toBe('0');
            expect(screen.getByTestId('inspector-tab').textContent).toBe('');
        });
    });
});
