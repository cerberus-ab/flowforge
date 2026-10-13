import type { AgentResult, AgentResultElement, QueryResponse } from '@flowforge/contract';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import type { Message, MessageResponse, RestoreQueryResponse } from '@/messaging';
import { BackgroundClient } from '@/background';
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
const trailSnapshot = createPageTrailDtoFixture().metadata.snapshot;

function PopupHarness(options: UsePopupOptions) {
    const popup = usePopup(options);

    return (
        <section>
            <input
                aria-label="Question"
                value={popup.inputQuestion}
                onInput={(event) => {
                    popup.setInputQuestion(event.currentTarget.value);
                }}
            />
            <button type="button" onClick={() => void popup.navigateToElement(resultElement)}>
                Navigate
            </button>
            <button type="button" onClick={() => void popup.openPageInspector('interactive')}>
                Open Inspector
            </button>
            <button type="button" onClick={() => void popup.askPresetQuestion()}>
                Ask next preset
            </button>
            <div data-testid="preset-submit-label">{popup.presetSubmitLabel}</div>
            <div data-testid="unavailable-question">{String(popup.isUnavailableQuestion)}</div>
            <button type="button" onClick={() => void popup.clearResult()}>
                Clear result
            </button>
            <div data-testid="result">{popup.result?.answer ?? ''}</div>
            <div data-testid="metadata">{popup.resultMetadata ?? ''}</div>
            <ul>
                {popup.examples.map((example) => (
                    <li key={`${example.type}:${example.question}`}>
                        <button type="button" onClick={() => popup.applyExampleQuestion(example.question)}>
                            {example.question}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

type TestMessageResponse =
    MessageResponse | MessageResponse<{ questions: string[] }> | MessageResponse<RestoreQueryResponse>;

function defaultResponseFor(message: Message): TestMessageResponse {
    if (message.type === 'GET_PREV_QUESTIONS') {
        return {
            success: true,
            data: {
                questions: [],
            },
        };
    }
    if (message.type === 'RESTORE_QUERY') {
        return { success: true, data: { status: 'empty' } };
    }
    return { success: true };
}

function renderPopup({
    handler,
    initialQuestion,
    presetQuestions,
}: {
    handler?: (message: Message) => Promise<TestMessageResponse> | TestMessageResponse | undefined;
    initialQuestion?: string;
    presetQuestions?: string[];
} = {}) {
    const transport = new FakeTransportService({ activePageId: 42 });
    const backgroundClient = new BackgroundClient(transport);
    const messages: Message[] = [];

    transport.addMessageListener((message) => {
        messages.push(message);
        return handler?.(message) ?? defaultResponseFor(message);
    });

    const rendered = render(
        <PopupHarness
            backgroundClient={backgroundClient}
            initialQuestion={initialQuestion}
            presetQuestions={presetQuestions}
        />,
    );

    return { messages, transport, unmount: rendered.unmount };
}

describe('usePopup', () => {
    it('does not submit a restored question outside the presets', async () => {
        // Given
        const { messages } = renderPopup({
            presetQuestions: ['First question?'],
            handler: (message) => {
                if (message.type === 'RESTORE_QUERY') {
                    return {
                        success: true,
                        data: {
                            status: 'completed',
                            queryId: 'restored-query',
                            data: {
                                question: 'Unknown question?',
                                result,
                                metadata: queryResponse.metadata,
                                trailSnapshot,
                            },
                        },
                    };
                }
                return undefined;
            },
        });
        await waitFor(() =>
            expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('Unknown question?'),
        );

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Then
        expect(screen.getByTestId('unavailable-question').textContent).toBe('true');
        expect(messages.some((message) => message.type === 'ASK_QUESTION')).toBe(false);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'First question?' }));

        // Then
        expect(screen.getByTestId('unavailable-question').textContent).toBe('false');
    });

    it('cycles demo questions from the current list selection and wraps after the last question', async () => {
        // Given
        const questions = ['First question?', 'Second question?', 'Third question?'];
        const { messages } = renderPopup({
            presetQuestions: questions,
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-1' } };
                return undefined;
            },
        });
        const submittedQuestions = () =>
            messages.filter((message) => message.type === 'ASK_QUESTION').map((message) => message.data.question);

        // When: no question is selected yet.
        expect(screen.getByTestId('preset-submit-label').textContent).toBe('Ask next question');
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));
        await waitFor(() => expect(submittedQuestions()).toEqual(['First question?']));
        expect(screen.getByTestId('preset-submit-label').textContent).toBe('Ask next question');

        // When: selecting a question changes the position in the cycle.
        fireEvent.click(screen.getByRole('button', { name: 'Second question?' }));
        expect(screen.getByTestId('preset-submit-label').textContent).toBe('Ask question');
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));
        await waitFor(() => expect(submittedQuestions()).toEqual(['First question?', 'Second question?']));
        expect(screen.getByTestId('preset-submit-label').textContent).toBe('Ask next question');

        // When: the next submit advances without another list selection.
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));
        await waitFor(() =>
            expect(submittedQuestions()).toEqual(['First question?', 'Second question?', 'Third question?']),
        );

        // When: the last question is selected.
        fireEvent.click(screen.getByRole('button', { name: 'Third question?' }));
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));

        // Then
        await waitFor(() =>
            expect(submittedQuestions()).toEqual([
                'First question?',
                'Second question?',
                'Third question?',
                'Third question?',
            ]),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));
        await waitFor(() =>
            expect(submittedQuestions()).toEqual([
                'First question?',
                'Second question?',
                'Third question?',
                'Third question?',
                'First question?',
            ]),
        );
    });

    it('continues the demo cycle after an initial preset question', async () => {
        // Given
        const { messages } = renderPopup({
            initialQuestion: 'Second question?',
            presetQuestions: ['First question?', 'Second question?', 'Third question?'],
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-1' } };
                return undefined;
            },
        });
        await waitFor(() =>
            expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('Second question?'),
        );
        expect(screen.getByTestId('preset-submit-label').textContent).toBe('Ask question');

        // When: the initial question is submitted before advancing.
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));

        // Then
        await waitFor(() =>
            expect(messages).toContainEqual({ type: 'ASK_QUESTION', data: { question: 'Second question?' } }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));
        await waitFor(() =>
            expect(messages).toContainEqual({ type: 'ASK_QUESTION', data: { question: 'Third question?' } }),
        );
    });

    it('repeats the selected demo question after clearing its result', async () => {
        // Given
        const { messages } = renderPopup({
            presetQuestions: ['First question?', 'Second question?', 'Third question?'],
            handler: (message) => {
                if (message.type === 'RESTORE_QUERY') {
                    return {
                        success: true,
                        data: {
                            status: 'completed',
                            queryId: 'query-1',
                            data: {
                                question: 'Second question?',
                                result,
                                metadata: queryResponse.metadata,
                                trailSnapshot,
                            },
                        },
                    };
                }
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-1' } };
                if (message.type === 'CLEAR_QUERY') return { success: true, data: true };
                return undefined;
            },
        });
        await screen.findByText(result.answer);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));
        await waitFor(() => {
            expect(messages.some((message) => message.type === 'CLEAR_QUERY')).toBe(true);
            expect(screen.getByTestId('result').textContent).toBe('');
        });
        expect(screen.getByTestId('preset-submit-label').textContent).toBe('Ask question');
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));

        // Then
        await waitFor(() =>
            expect(
                messages.filter((message) => message.type === 'ASK_QUESTION').map((message) => message.data.question),
            ).toEqual(['Second question?']),
        );
    });

    it('repeats a restored demo question with a current result before advancing', async () => {
        // Given
        const { messages } = renderPopup({
            presetQuestions: ['First question?', 'Second question?', 'Third question?'],
            handler: (message) => {
                if (message.type === 'RESTORE_QUERY') {
                    return {
                        success: true,
                        data: {
                            status: 'completed',
                            queryId: 'query-1',
                            data: {
                                question: 'Second question?',
                                result,
                                metadata: queryResponse.metadata,
                                trailSnapshot,
                            },
                        },
                    };
                }
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-2' } };
                return undefined;
            },
        });
        await screen.findByText(result.answer);
        expect(screen.getByTestId('preset-submit-label').textContent).toBe('Ask question');

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));

        // Then
        await waitFor(() =>
            expect(messages).toContainEqual({ type: 'ASK_QUESTION', data: { question: 'Second question?' } }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));
        await waitFor(() =>
            expect(messages).toContainEqual({ type: 'ASK_QUESTION', data: { question: 'Third question?' } }),
        );
    });

    it('repeats a restored demo question when its result is stale', async () => {
        // Given
        const { messages } = renderPopup({
            presetQuestions: ['First question?', 'Second question?'],
            handler: (message) => {
                if (message.type === 'RESTORE_QUERY') {
                    return {
                        success: true,
                        data: {
                            status: 'stale',
                            queryId: 'query-1',
                            data: {
                                question: 'Second question?',
                                result,
                                metadata: queryResponse.metadata,
                                trailSnapshot,
                            },
                        },
                    };
                }
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-2' } };
                return undefined;
            },
        });
        await screen.findByText(result.answer);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Ask next preset' }));

        // Then
        await waitFor(() =>
            expect(messages).toContainEqual({ type: 'ASK_QUESTION', data: { question: 'Second question?' } }),
        );
    });

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
                    type: 'POPUP_OPENED',
                }),
                expect.objectContaining({
                    type: 'RESTORE_QUERY',
                }),
                expect.objectContaining({
                    type: 'GET_PREV_QUESTIONS',
                }),
            ]),
        );
    });

    it('restores a completed query without affecting previous-question examples', async () => {
        // Given
        const { messages } = renderPopup({
            handler: (message) => {
                if (message.type === 'RESTORE_QUERY') {
                    return {
                        success: true,
                        data: {
                            status: 'completed',
                            queryId: 'query-1',
                            data: {
                                question: 'How do I open settings?',
                                result,
                                metadata: queryResponse.metadata,
                                trailSnapshot,
                            },
                        },
                    };
                }
                if (message.type === 'GET_PREV_QUESTIONS') {
                    return { success: true, data: { questions: ['Where is billing?'] } };
                }
                return undefined;
            },
        });

        // Then
        await waitFor(() => {
            expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('How do I open settings?');
            expect(screen.getByTestId('result').textContent).toBe(result.answer);
            expect(screen.getByTestId('metadata').textContent).toBe('test-model · 1.2k tokens · 1.3s');
        });
        expect(await screen.findByText('Where is billing?')).toBeTruthy();
        expect(messages).toContainEqual({ type: 'RESTORE_QUERY' });
        expect(messages).toContainEqual({ type: 'GET_PREV_QUESTIONS' });
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
                        data: {
                            element: resultElement,
                        },
                    }),
                    expect.objectContaining({
                        type: 'OPEN_PAGE_INSPECTOR',
                        data: {
                            tab: 'interactive',
                        },
                    }),
                ]),
            );
        });
    });
});
