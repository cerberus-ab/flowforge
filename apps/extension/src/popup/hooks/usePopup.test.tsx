import type { AgentResult, AgentResultElement, QueryResponse } from '@flowforge/contract';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import type { Message, MessageResponse } from '@/types';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { usePopup, type UsePopupOptions } from './usePopup';

const resultElement: AgentResultElement = {
    text: 'Settings',
    dataId: 'flowforge-settings',
    cssSelector: '[data-flowforge-id="flowforge-settings"]',
    action: 'click',
};

const result: AgentResult = {
    answer: 'Open settings from the sidebar.',
    elements: [resultElement],
    mode: 'direct',
    topic: 'settings',
};

const queryResponse: QueryResponse = {
    result,
    metadata: {
        model: 'test-model',
        execTimeMs: 1250,
        usage: {
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 1234,
        },
    },
};

function PopupHarness(options: UsePopupOptions) {
    const popup = usePopup(options);

    return (
        <section>
            <input
                aria-label="Question"
                value={popup.question}
                onInput={(event) => {
                    popup.setQuestion(event.currentTarget.value);
                }}
            />
            <button type="button" onClick={() => void popup.askQuestion()}>
                Ask
            </button>
            <button type="button" onClick={() => void popup.navigateToElement(resultElement)}>
                Navigate
            </button>
            <button type="button" onClick={() => void popup.openPageInspector('interactive')}>
                Open Inspector
            </button>
            <div data-testid="loading">{String(popup.isLoading)}</div>
            <div data-testid="result">{popup.result?.answer ?? ''}</div>
            <div data-testid="metadata">{popup.resultMetadata ?? ''}</div>
            <ul>
                {popup.examples.map((example) => (
                    <li key={`${example.type}:${example.question}`}>{example.question}</li>
                ))}
            </ul>
            {popup.error && <p>{popup.error}</p>}
        </section>
    );
}

type TestMessageResponse = MessageResponse | MessageResponse<{ questions: string[] }> | MessageResponse<QueryResponse>;

function defaultResponseFor(message: Message): TestMessageResponse {
    if (message.type === 'GET_PREV_QUESTIONS') {
        return {
            success: true,
            data: {
                questions: [],
            },
        };
    }
    return { success: true };
}

function renderPopup({
    handler,
}: {
    handler?: (message: Message) => Promise<TestMessageResponse> | TestMessageResponse | undefined;
} = {}) {
    const transport = new FakeTransportService({ activeSenderId: 42 });
    const messages: Message[] = [];

    transport.addMessageListener((message) => {
        messages.push(message);
        return handler?.(message) ?? defaultResponseFor(message);
    });

    render(<PopupHarness transport={transport} />);

    return { messages };
}

describe('usePopup', () => {
    it('initializes the popup and loads previous questions', async () => {
        // Given / When
        const { messages } = renderPopup({
            handler: (message) => {
                if (message.type === 'GET_PREV_QUESTIONS') {
                    return {
                        success: true,
                        data: {
                            questions: ['Where is billing?'],
                        },
                    };
                }
                return undefined;
            },
        });

        // Then
        expect(await screen.findByText('Where is billing?')).toBeTruthy();
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'POPUP_INITIALISE',
                    senderId: 42,
                }),
                expect.objectContaining({
                    type: 'GET_PREV_QUESTIONS',
                    senderId: 42,
                }),
            ]),
        );
    });

    it('validates questions before asking the background', async () => {
        // Given
        const { messages } = renderPopup();

        // When
        fireEvent.click(await screen.findByRole('button', { name: 'Ask' }));

        // Then
        expect(await screen.findByText('Please enter a question')).toBeTruthy();
        expect(messages.some((message) => message.type === 'ASK_QUESTION')).toBe(false);
    });

    it('asks normalized questions and renders the result', async () => {
        // Given
        const { messages } = renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    return {
                        success: true,
                        data: queryResponse,
                    };
                }
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), {
            target: { value: '  How do I open settings?  ' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

        // Then
        expect(await screen.findByText(result.answer)).toBeTruthy();
        expect(screen.getByText('test-model · 1.2k tokens · 1.3s')).toBeTruthy();
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'ASK_QUESTION',
                    senderId: 42,
                    data: {
                        question: 'How do I open settings?',
                    },
                }),
            ]),
        );
    });

    it('shows loading while a question request is pending', async () => {
        // Given
        let resolveQuestion!: (response: MessageResponse<QueryResponse>) => void;
        renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    return new Promise<MessageResponse<QueryResponse>>((resolve) => {
                        resolveQuestion = resolve;
                    });
                }
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), { target: { value: 'How do I open settings?' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('true');
        });

        // When
        resolveQuestion({
            success: true,
            data: queryResponse,
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
    });

    it('renders question request failures', async () => {
        // Given
        renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    return {
                        success: false,
                        error: 'Backend rejected the question',
                    };
                }
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), { target: { value: 'How do I open settings?' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

        // Then
        expect(await screen.findByText('Backend rejected the question')).toBeTruthy();
    });

    it('sends page action messages', async () => {
        // Given
        const { messages } = renderPopup();

        // When
        fireEvent.click(await screen.findByRole('button', { name: 'Navigate' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open Inspector' }));

        // Then
        await waitFor(() => {
            expect(messages).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'NAVIGATE_TO_ELEMENT',
                        senderId: 42,
                        data: {
                            element: resultElement,
                        },
                    }),
                    expect.objectContaining({
                        type: 'OPEN_PAGE_INSPECTOR',
                        senderId: 42,
                        data: {
                            tab: 'interactive',
                        },
                    }),
                ]),
            );
        });
    });
});
