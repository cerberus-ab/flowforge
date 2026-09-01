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
});
