import type { AgentResultElement } from '@flowforge/contract';
import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { ResultElements } from './ResultElements';

const element: AgentResultElement = {
    text: 'Settings',
    dataId: 'flowforge-settings',
    cssSelector: '#settings-button',
    action: 'click',
};

describe('ResultElements', () => {
    it('renders direct findings as navigation buttons', () => {
        // Given
        const onNavigateToElement = vi.fn();

        // When
        render(
            <ResultElements
                elements={[element]}
                mode="direct"
                isStale={false}
                onNavigateToElement={onNavigateToElement}
                onOpenOnboarding={vi.fn()}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

        // Then
        expect(screen.getByText('Relevant findings')).toBeTruthy();
        expect(onNavigateToElement).toHaveBeenCalledWith(element);
        expect(screen.queryByRole('button', { name: 'Open onboarding' })).toBeNull();
    });

    it('renders stale direct findings without navigation actions', () => {
        const onNavigateToElement = vi.fn();

        render(
            <ResultElements
                elements={[element]}
                mode="direct"
                isStale
                onNavigateToElement={onNavigateToElement}
                onOpenOnboarding={vi.fn()}
            />,
        );

        expect(screen.getByText('Settings').tagName).toBe('DIV');
        expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Open onboarding' })).toBeNull();
        expect(onNavigateToElement).not.toHaveBeenCalled();
    });

    it('renders step results as static walkthrough items', () => {
        // Given / When
        const onOpenOnboarding = vi.fn();
        render(
            <ResultElements
                elements={[element]}
                mode="steps"
                isStale={false}
                onNavigateToElement={vi.fn()}
                onOpenOnboarding={onOpenOnboarding}
            />,
        );
        expect(screen.getByTestId('flowforge-open-onboarding')).toBe(document.activeElement);
        fireEvent.click(screen.getByRole('button', { name: 'Open onboarding' }));

        // Then
        expect(screen.getByText('Walkthrough')).toBeTruthy();
        expect(screen.getByText('Step 1:')).toBeTruthy();
        expect(screen.getByText('To continue')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
        expect(onOpenOnboarding).toHaveBeenCalledOnce();
        expect(screen.getByTestId('flowforge-open-onboarding').classList.contains('flowforge-button--primary')).toBe(
            true,
        );
        expect(screen.getByTestId('flowforge-open-onboarding').parentElement?.className).toContain(
            'flowforge-elements__actions',
        );
    });
});
