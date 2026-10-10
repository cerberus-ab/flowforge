import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { Question } from './Question';

function renderQuestion({
    onInputQuestionChange = vi.fn(),
    onAskQuestion = vi.fn(),
    disabled = false,
    selectOnly = false,
}: {
    onInputQuestionChange?: (value: string) => void;
    onAskQuestion?: () => Promise<void>;
    disabled?: boolean;
    selectOnly?: boolean;
} = {}) {
    render(
        <Question
            inputQuestion=""
            onInputQuestionChange={onInputQuestionChange}
            onAskQuestion={onAskQuestion}
            placeholder="Ask about this page"
            disabled={disabled}
            selectOnly={selectOnly}
        />,
    );

    return { onInputQuestionChange, onAskQuestion };
}

describe('Question', () => {
    it('updates the question and submits from the form or Enter key', () => {
        // Given
        const { onInputQuestionChange, onAskQuestion } = renderQuestion();
        const textarea = screen.getByLabelText('Your question');

        // When
        fireEvent.input(textarea, { target: { value: 'How do I save?' } });
        fireEvent.keyDown(textarea, { key: 'Enter' });
        fireEvent.submit(textarea.closest('form')!);

        // Then
        expect(onInputQuestionChange).toHaveBeenCalledWith('How do I save?');
        expect(onAskQuestion).toHaveBeenCalledTimes(2);
    });

    it('marks the textarea read-only for select-only mode and disables controls while loading', () => {
        // Given / When
        renderQuestion({ disabled: true, selectOnly: true });

        // Then
        expect((screen.getByLabelText('Your question') as HTMLTextAreaElement).readOnly).toBe(true);
        expect((screen.getByLabelText('Your question') as HTMLTextAreaElement).disabled).toBe(true);
        expect((screen.getByRole('button', { name: 'Ask anything' }) as HTMLButtonElement).disabled).toBe(true);
    });
});
