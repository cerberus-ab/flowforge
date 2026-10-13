import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { BackgroundClient } from '@/background';
import { FakeTransportService } from '../../test/unit/fakes/FakeTransportService';
import { PopupApp, type PopupAppProps } from './PopupApp';

function renderPopup(props: Partial<PopupAppProps> = {}) {
    const transport = new FakeTransportService();
    transport.addMessageListener((message) => {
        if (message.type === 'RESTORE_QUERY') return { success: true, data: { status: 'empty' } };
        if (message.type === 'GET_PREV_QUESTIONS') return { success: true, data: { questions: [] } };
        return { success: true };
    });

    return render(
        <PopupApp
            variant="dialog"
            backgroundClient={new BackgroundClient(transport)}
            theme="dark"
            onToggleTheme={vi.fn(async () => undefined)}
            {...props}
        />,
    );
}

describe('PopupApp configuration', () => {
    it('uses preset behavior without demo presentation', async () => {
        // Given / When
        renderPopup({ presetQuestions: ['First question?', 'Second question?'] });
        const questionInput = screen.getByTestId('flowforge-question-input') as HTMLTextAreaElement;

        // Then
        expect(questionInput.readOnly).toBe(true);
        expect(await screen.findByText('Available questions')).toBeTruthy();
        expect(screen.queryByText('✧ Demo mode enabled ✧')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Second question?' }));
        expect(screen.getByTestId('flowforge-question-submit').textContent).toBe('Ask question');
    });

    it('shows demo presentation without enabling preset behavior', async () => {
        // Given / When
        renderPopup({ demoPresentation: { topic: 'Sandbox' } });
        const questionInput = screen.getByTestId('flowforge-question-input') as HTMLTextAreaElement;

        // Then
        expect(screen.getByText('✧ Demo for Sandbox enabled ✧')).toBeTruthy();
        expect(questionInput.readOnly).toBe(false);
        expect(screen.getByTestId('flowforge-question-submit').textContent).toBe('Ask anything');
        expect(await screen.findByText('Try one of these')).toBeTruthy();
    });

    it('does not submit when preset mode has no questions', () => {
        // Given / When
        renderPopup({ demoPresentation: {}, presetQuestions: [] });
        const questionInput = screen.getByTestId('flowforge-question-input') as HTMLTextAreaElement;
        const submit = screen.getByTestId('flowforge-question-submit') as HTMLButtonElement;

        // Then
        expect(screen.getByText('✧ Demo mode enabled ✧')).toBeTruthy();
        expect(questionInput.readOnly).toBe(true);
        expect(questionInput.placeholder).toBe('No preset questions available.');
        expect(submit.disabled).toBe(true);
        expect(screen.queryByText('Available questions')).toBeNull();
    });

    it('shows an error for an initial question outside the presets until one is selected', async () => {
        // Given / When
        renderPopup({ presetQuestions: ['First question?', 'Second question?'], initialQuestion: 'Unknown question?' });
        const questionInput = screen.getByTestId('flowforge-question-input') as HTMLTextAreaElement;
        const submit = screen.getByTestId('flowforge-question-submit') as HTMLButtonElement;

        // Then
        await waitFor(() => expect(questionInput.value).toBe('Unknown question?'));
        expect(screen.getByText("This question isn't available. Choose one below.")).toBeTruthy();
        expect(submit.disabled).toBe(true);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Second question?' }));

        // Then
        expect(questionInput.value).toBe('Second question?');
        expect(screen.queryByText("This question isn't available. Choose one below.")).toBeNull();
        expect(submit.disabled).toBe(false);
    });
});
