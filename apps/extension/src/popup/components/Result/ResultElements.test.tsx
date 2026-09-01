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
        render(<ResultElements elements={[element]} mode="direct" onNavigateToElement={onNavigateToElement} />);
        fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

        // Then
        expect(screen.getByText('Relevant findings')).toBeTruthy();
        expect(onNavigateToElement).toHaveBeenCalledWith(element);
    });

    it('renders step results as static walkthrough items', () => {
        // Given / When
        render(<ResultElements elements={[element]} mode="steps" onNavigateToElement={vi.fn()} />);

        // Then
        expect(screen.getByText('Walkthrough')).toBeTruthy();
        expect(screen.getByText('Step 1:')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
    });
});
