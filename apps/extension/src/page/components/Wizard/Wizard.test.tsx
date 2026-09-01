import type { AgentResultElement } from '@flowforge/contract';
import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Wizard } from './Wizard';

const steps: AgentResultElement[] = [
    {
        text: 'Settings',
        dataId: 'flowforge-settings',
        cssSelector: '#settings-button',
        action: 'click',
    },
    {
        text: 'Billing',
        dataId: 'flowforge-billing',
        cssSelector: '#billing-button',
        action: 'click',
    },
];

function renderWizard({
    currentStep = 0,
    close = vi.fn(),
    changeStep = vi.fn(),
}: {
    currentStep?: number;
    close?: () => void;
    changeStep?: (step: number) => void;
} = {}) {
    render(
        <Wizard
            title="Setup flow"
            description="Follow these steps."
            steps={steps}
            currentStep={currentStep}
            close={close}
            changeStep={changeStep}
        />,
    );

    return { close, changeStep };
}

describe('Wizard', () => {
    it('renders the start screen and exposes start and finish actions', () => {
        // Given
        const close = vi.fn();
        const changeStep = vi.fn();

        // When
        renderWizard({ close, changeStep });

        // Then
        expect(screen.getByRole('heading', { name: 'Setup flow' })).toBeTruthy();
        expect(screen.getByText('Follow these steps.')).toBeTruthy();
        expect(screen.getByText('2-step walkthrough')).toBeTruthy();

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Start onboarding' }));
        fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

        // Then
        expect(changeStep).toHaveBeenCalledWith(1);
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('renders step controls and clamps previous and next navigation', () => {
        // Given
        const changeStep = vi.fn();

        // When
        renderWizard({ currentStep: 1, changeStep });

        // Then
        expect(screen.getByText('Step 1 of 2')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        // Then
        expect(changeStep).toHaveBeenCalledWith(2);
    });

    it('handles keyboard navigation when focus is outside editable fields', () => {
        // Given
        const close = vi.fn();
        const changeStep = vi.fn();
        renderWizard({ currentStep: 1, close, changeStep });

        // When
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        fireEvent.keyDown(document, { key: 'Escape' });

        // Then
        expect(changeStep).toHaveBeenCalledWith(2);
        expect(changeStep).toHaveBeenCalledWith(1);
        expect(close).toHaveBeenCalledTimes(1);
    });
});
