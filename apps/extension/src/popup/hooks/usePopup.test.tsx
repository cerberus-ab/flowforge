import type { AgentResult, AgentResultElement, QueryResponse } from '@flowforge/contract';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import type { Message, MessageResponse, PopupMessage, RestoreQueryResponse } from '@/messaging';
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
            <div data-testid="normalized-question">{popup.question}</div>
            <button type="button" onClick={() => void popup.askQuestion()}>
                Ask
            </button>
            <button type="button" onClick={() => void popup.navigateToElement(resultElement)}>
                Navigate
            </button>
            <button type="button" onClick={() => void popup.openOnboarding()}>
                Open Onboarding
            </button>
            <button type="button" onClick={() => void popup.openPageInspector('interactive')}>
                Open Inspector
            </button>
            <div data-testid="loading">{String(popup.isLoading)}</div>
            <div data-testid="result">{popup.result?.answer ?? ''}</div>
            <div data-testid="metadata">{popup.resultMetadata ?? ''}</div>
            <div data-testid="warning">{popup.warning ?? ''}</div>
            <ul>
                {popup.examples.map((example) => (
                    <li key={`${example.type}:${example.question}`}>{example.question}</li>
                ))}
            </ul>
            {popup.error && <p>{popup.error}</p>}
        </section>
    );
}

type TestMessageResponse =
    | MessageResponse
    | MessageResponse<{ questions: string[] }>
    | MessageResponse<QueryResponse>
    | MessageResponse<RestoreQueryResponse>;

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
}: {
    handler?: (message: Message) => Promise<TestMessageResponse> | TestMessageResponse | undefined;
    initialQuestion?: string;
} = {}) {
    const transport = new FakeTransportService({ activePageId: 42 });
    const backgroundClient = new BackgroundClient(transport);
    const messages: Message[] = [];

    transport.addMessageListener((message) => {
        messages.push(message);
        return handler?.(message) ?? defaultResponseFor(message);
    });

    const rendered = render(<PopupHarness backgroundClient={backgroundClient} initialQuestion={initialQuestion} />);

    return { messages, transport, unmount: rendered.unmount };
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

    it('restores a pending query and shows a loading state', async () => {
        // Given
        renderPopup({
            handler: (message) => {
                if (message.type === 'RESTORE_QUERY') {
                    return {
                        success: true,
                        data: {
                            status: 'pending',
                            queryId: 'query-1',
                            data: { question: 'How do I open settings?' },
                        },
                    };
                }
                return undefined;
            },
        });

        // Then
        await waitFor(() => {
            expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('How do I open settings?');
        });
        expect(screen.getByTestId('loading').textContent).toBe('true');
        expect(screen.getByTestId('result').textContent).toBe('');
    });

    it('restores a stale answer with a warning', async () => {
        renderPopup({
            handler: (message) => {
                if (message.type === 'RESTORE_QUERY') {
                    return {
                        success: true,
                        data: {
                            status: 'stale',
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
                return undefined;
            },
        });

        await waitFor(() => {
            expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('How do I open settings?');
            expect(screen.getByTestId('result').textContent).toBe(result.answer);
        });
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('warning').textContent).toContain('page has changed');
    });

    it('uses an explicit initial question instead of restoring a previous session', async () => {
        // Given
        const { messages } = renderPopup({ initialQuestion: 'Question from the embed caller' });

        // Then
        await waitFor(() => {
            expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe(
                'Question from the embed caller',
            );
        });
        expect(messages.some((message) => message.type === 'RESTORE_QUERY')).toBe(false);
    });

    it('does not restore a previous session over an explicit initial question on notifications', async () => {
        const { messages, transport } = renderPopup({ initialQuestion: 'Question from the embed caller' });

        await act(async () => {
            await transport.sendToPopup(42, {
                type: 'QUERY_FINISHED',
                data: { queryId: 'previous-query' },
            } as PopupMessage);
        });

        expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('Question from the embed caller');
        expect(messages.some((message) => message.type === 'RESTORE_QUERY')).toBe(false);
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
                        data: { queryId: 'query-1' },
                    };
                }
                if (message.type === 'RESTORE_QUERY')
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
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), {
            target: { value: '  How do I open settings?  ' },
        });
        expect(screen.getByTestId('normalized-question').textContent).toBe('How do I open settings?');
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

        // Then
        expect(await screen.findByText(result.answer)).toBeTruthy();
        expect(screen.getByText('test-model · 1.2k tokens · 1.3s')).toBeTruthy();

        // A changed question keeps the result visible but clearly marks it as belonging to the old question.
        fireEvent.input(screen.getByLabelText('Question'), { target: { value: 'A different question' } });
        expect(screen.getByTestId('warning').textContent).toContain('question has changed');
        expect(screen.getByTestId('warning').textContent).toContain(
            'The question has changed. This result is for the previous question: "How do I open settings?"',
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open Onboarding' }));
        await waitFor(() => expect(messages.find((message) => message.type === 'OPEN_ONBOARDING')).toBeDefined());
        fireEvent.input(screen.getByLabelText('Question'), { target: { value: 'How do I open settings?' } });
        expect(screen.getByTestId('warning').textContent).toContain('question has changed');
        expect(screen.getByTestId('warning').textContent).toContain(
            'The question has changed. This result is for the previous question: "How do I open settings?"',
        );
        expect(messages).toContainEqual({ type: 'ASK_QUESTION', data: { question: 'How do I open settings?' } });
        expect(messages).toContainEqual({ type: 'NAVIGATE_TO_ELEMENT', data: { element: resultElement } });
        const onboardingMessage = messages.find((message) => message.type === 'OPEN_ONBOARDING');
        expect(onboardingMessage).toMatchObject({
            type: 'OPEN_ONBOARDING',
            data: {
                question: 'How do I open settings?',
                result: { mode: 'direct', elements: [resultElement] },
            },
        });
    });

    it('does not open onboarding until requested for a steps result', async () => {
        // Given
        const stepsResult = { ...result, mode: 'steps' as const };
        const { messages } = renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-1' } };
                if (message.type === 'RESTORE_QUERY')
                    return {
                        success: true,
                        data: {
                            status: 'completed',
                            queryId: 'query-1',
                            data: {
                                question: 'How do I open settings?',
                                result: stepsResult,
                                metadata: queryResponse.metadata,
                                trailSnapshot,
                            },
                        },
                    };
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), { target: { value: 'How do I open settings?' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

        // Then
        expect(await screen.findByText(stepsResult.answer)).toBeTruthy();
        expect(messages.some((message) => message.type === 'OPEN_ONBOARDING')).toBe(false);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Open Onboarding' }));

        // Then
        await waitFor(() => expect(messages.some((message) => message.type === 'OPEN_ONBOARDING')).toBe(true));
    });

    it('shows loading while a question request is pending', async () => {
        // Given
        let resolveQuestion!: (response: MessageResponse<{ queryId: string }>) => void;
        let restored: RestoreQueryResponse = { status: 'empty' };
        const { transport } = renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    return new Promise<MessageResponse<{ queryId: string }>>((resolve) => {
                        resolveQuestion = resolve;
                    });
                }
                if (message.type === 'RESTORE_QUERY') return { success: true, data: restored };
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
            data: { queryId: 'query-1' },
        });
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('true'));

        // The background completes the persisted session and notifies this popup.
        restored = {
            status: 'completed',
            queryId: 'query-1',
            data: {
                question: 'How do I open settings?',
                result,
                metadata: queryResponse.metadata,
                trailSnapshot,
            },
        };
        await act(async () => {
            await transport.sendToPopup(42, {
                type: 'QUERY_FINISHED',
                data: { queryId: 'query-1' },
            } as PopupMessage);
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
            expect(screen.getByTestId('result').textContent).toBe(result.answer);
        });
    });

    it('stops loading and shows an error if the finished query cannot be restored', async () => {
        // Given
        let resolvePendingRestore!: (response: MessageResponse<RestoreQueryResponse>) => void;
        let restoreCount = 0;
        const { transport } = renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-1' } };
                if (message.type === 'RESTORE_QUERY') {
                    restoreCount += 1;
                    if (restoreCount === 1) return { success: true, data: { status: 'empty' } };
                    if (restoreCount === 2) {
                        return new Promise<MessageResponse<RestoreQueryResponse>>((resolve) => {
                            resolvePendingRestore = resolve;
                        });
                    }
                    return { success: false, error: 'Page is unavailable' };
                }
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), { target: { value: 'How do I save?' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(restoreCount).toBe(2));
        await act(async () => {
            await transport.sendToPopup(42, {
                type: 'QUERY_FINISHED',
                data: { queryId: 'query-1' },
            } as PopupMessage);
        });
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        await act(async () => {
            resolvePendingRestore({
                success: true,
                data: { status: 'pending', queryId: 'query-1', data: { question: 'How do I save?' } },
            });
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
            expect(
                screen.getByText(
                    'The query finished, but its result could not be loaded. Reopen the popup to try again.',
                ),
            ).toBeTruthy();
        });
    });

    it('does not navigate to a result when the popup unmounts before the query completes', async () => {
        // Given
        let resolveQuestion!: (response: MessageResponse<{ queryId: string }>) => void;
        const { messages, unmount } = renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    return new Promise<MessageResponse<{ queryId: string }>>((resolve) => {
                        resolveQuestion = resolve;
                    });
                }
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), { target: { value: 'How do I open settings?' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('true'));
        unmount();

        await act(async () => {
            resolveQuestion({ success: true, data: { queryId: 'query-1' } });
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        // Then
        expect(messages.some((message) => message.type === 'NAVIGATE_TO_ELEMENT')).toBe(false);
    });

    it('does not apply a restored result after the popup unmounts', async () => {
        // Given
        let resolveRestore!: (response: MessageResponse<RestoreQueryResponse>) => void;
        let restoreCount = 0;
        const { messages, unmount } = renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-1' } };
                if (message.type === 'RESTORE_QUERY') {
                    restoreCount += 1;
                    if (restoreCount === 1) return { success: true, data: { status: 'empty' } };
                    return new Promise<MessageResponse<RestoreQueryResponse>>((resolve) => {
                        resolveRestore = resolve;
                    });
                }
                return undefined;
            },
        });

        // When
        fireEvent.input(await screen.findByLabelText('Question'), { target: { value: 'How do I open settings?' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(restoreCount).toBe(2));
        unmount();
        await act(async () => {
            resolveRestore({
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
            });
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        // Then
        expect(messages.some((message) => message.type === 'NAVIGATE_TO_ELEMENT')).toBe(false);
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

    it('stops loading when the new query session cannot be restored', async () => {
        renderPopup({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') return { success: true, data: { queryId: 'query-1' } };
                return undefined;
            },
        });

        fireEvent.input(await screen.findByLabelText('Question'), { target: { value: 'How do I open settings?' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

        expect(await screen.findByText('The query is no longer available. Please try again.')).toBeTruthy();
        expect(screen.getByTestId('loading').textContent).toBe('false');
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
