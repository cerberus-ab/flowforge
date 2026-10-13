import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Examples } from './Examples';

describe('Examples', () => {
    it('renders example questions and notifies when one is selected', () => {
        // Given
        const onExampleQuestionSelect = vi.fn();

        // When
        render(
            <Examples
                examples={[
                    { question: 'Where is billing?', type: 'previous' },
                    { question: 'What is this page about?', type: 'default' },
                ]}
                onExampleQuestionSelect={onExampleQuestionSelect}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Where is billing?' }));

        // Then
        expect(onExampleQuestionSelect).toHaveBeenCalledWith('Where is billing?');
    });

    it('renders nothing when there are no examples', () => {
        // Given / When
        const { container } = render(<Examples examples={[]} onExampleQuestionSelect={vi.fn()} />);

        // Then
        expect(container.textContent).toBe('');
    });

    it('uses the demo title when provided', () => {
        render(
            <Examples
                examples={[{ question: 'Where is billing?', type: 'preset' }]}
                onExampleQuestionSelect={vi.fn()}
                title="Available questions"
            />,
        );

        expect(screen.getByText('Available questions')).toBeTruthy();
    });

    it('does not select examples when disabled', () => {
        // Given
        const onExampleQuestionSelect = vi.fn();
        render(
            <Examples
                examples={[{ question: 'Where is billing?', type: 'previous' }]}
                onExampleQuestionSelect={onExampleQuestionSelect}
                disabled
            />,
        );
        const example = screen.getByRole('button', { name: 'Where is billing?' }) as HTMLButtonElement;

        // When
        fireEvent.click(example);

        // Then
        expect(example.disabled).toBe(true);
        expect(onExampleQuestionSelect).not.toHaveBeenCalled();
    });
});
