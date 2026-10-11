import type { AgentResult, AgentResultElement } from '@flowforge/contract';
import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Result } from './Result';

const element: AgentResultElement = {
    text: 'Settings',
    dataId: 'flowforge-settings',
    cssSelector: '#settings-button',
    action: 'click',
};

const result: AgentResult = {
    answer: 'Open settings from the sidebar.',
    elements: [element],
    mode: 'direct',
    topic: 'settings',
};

describe('Result', () => {
    it('renders errors instead of results', () => {
        // Given / When
        render(
            <Result
                result={result}
                resultMetadata="test-model"
                isStale={false}
                error="Backend failed"
                onNavigateToElement={vi.fn()}
                onOpenOnboarding={vi.fn()}
                onClearResult={vi.fn()}
            />,
        );

        // Then
        expect(screen.getByText("Couldn't")).toBeTruthy();
        expect(screen.getByText('Backend failed')).toBeTruthy();
        expect(screen.queryByText(result.answer)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Clear result' })).toBeNull();
    });

    it('renders answers, metadata, and result element actions', () => {
        // Given
        const onNavigateToElement = vi.fn();
        const onClearResult = vi.fn();

        // When
        render(
            <Result
                result={result}
                resultMetadata="test-model · 1.2k tokens · 1.3s"
                isStale={false}
                error={null}
                onNavigateToElement={onNavigateToElement}
                onOpenOnboarding={vi.fn()}
                onClearResult={onClearResult}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
        fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));

        // Then
        expect(screen.getByText('Figured out')).toBeTruthy();
        expect(screen.getByText(result.answer)).toBeTruthy();
        expect(screen.getByText('test-model · 1.2k tokens · 1.3s')).toBeTruthy();
        expect(screen.getByRole('tooltip', { hidden: true }).textContent).toBe('Clear result');
        expect(screen.getByRole('button', { name: 'Clear result' }).closest('.flowforge-tooltip')?.className).toContain(
            'flowforge-tooltip--bottom',
        );
        expect(onNavigateToElement).toHaveBeenCalledWith(element);
        expect(onClearResult).toHaveBeenCalledOnce();
    });
});
