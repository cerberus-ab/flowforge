import type { AgentResult, AgentResultElement, QueryResponse } from '@flowforge/contract';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import type { Message, MessageResponse, PopupMessage, RestoreQueryResponse } from '@/messaging';
import { BackgroundClient, type PopupBackgroundClient } from '@/background';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { useQuerySession } from './useQuerySession';

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

function QuerySessionHarness({
    backgroundClient,
    initialQuestion,
}: {
    backgroundClient: PopupBackgroundClient;
    initialQuestion?: string;
}) {
    const session = useQuerySession(backgroundClient, initialQuestion);

    return (
        <section>
            <input
                aria-label="Question"
                value={session.inputQuestion}
                onInput={(event) => session.setInputQuestion(event.currentTarget.value)}
            />
            <div data-testid="normalized-question">{session.question}</div>
            <button type="button" onClick={() => void session.askQuestion()}>
                Ask
            </button>
            <button type="button" onClick={() => void session.openOnboarding()}>
                Open Onboarding
            </button>
            <button type="button" disabled={session.isClearingResult} onClick={() => void session.clearResult()}>
                Clear result
            </button>
            <div data-testid="loading">{String(session.isLoading)}</div>
            <div data-testid="result">{session.result?.answer ?? ''}</div>
            <div data-testid="metadata">{session.resultMetadata ?? ''}</div>
            <div data-testid="warning">{session.warning ?? ''}</div>
            {session.error && <p>{session.error}</p>}
        </section>
    );
}

type TestMessageResponse = MessageResponse | MessageResponse<RestoreQueryResponse>;

function defaultResponseFor(message: Message): TestMessageResponse {
    if (message.type === 'RESTORE_QUERY') {
        return { success: true, data: { status: 'empty' } };
    }
    return { success: true };
}

function renderQuerySession({
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

    const rendered = render(
        <QuerySessionHarness backgroundClient={backgroundClient} initialQuestion={initialQuestion} />,
    );

    return { messages, transport, unmount: rendered.unmount };
}

describe('useQuerySession', () => {
    it('restores a pending query and shows a loading state', async () => {
        // Given
        renderQuerySession({
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
        renderQuerySession({
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

    it('clears a restored result while keeping the question and ignoring its late notification', async () => {
        // Given
        const { messages, transport } = renderQuerySession({
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
                if (message.type === 'CLEAR_QUERY') return { success: true, data: true };
                return undefined;
            },
        });
        await screen.findByText(result.answer);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));

        // Then
        await waitFor(() => expect(screen.getByTestId('result').textContent).toBe(''));
        expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('How do I open settings?');
        expect(screen.getByTestId('warning').textContent).toBe('');
        expect(messages).toContainEqual({ type: 'CLEAR_QUERY', data: { queryId: 'query-1' } });
        const restoreCount = messages.filter((message) => message.type === 'RESTORE_QUERY').length;
        await act(async () => {
            await transport.sendToPopup({ type: 'QUERY_FINISHED', data: { queryId: 'query-1' } }, { pageId: 42 });
        });
        expect(messages.filter((message) => message.type === 'RESTORE_QUERY')).toHaveLength(restoreCount);
        expect(screen.getByTestId('result').textContent).toBe('');
    });

    it('keeps the result and shows a warning if clearing fails', async () => {
        // Given
        renderQuerySession({
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
                if (message.type === 'CLEAR_QUERY') return { success: false, error: 'Storage unavailable' };
                return undefined;
            },
        });
        await screen.findByText(result.answer);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));

        // Then
        await waitFor(() => expect(screen.getByTestId('warning').textContent).toContain('Could not clear this result'));
        expect(screen.getByTestId('result').textContent).toBe(result.answer);
    });

    it('disables a second clear request while the first is pending', async () => {
        // Given
        let finishClear!: (response: MessageResponse<boolean>) => void;
        const { messages } = renderQuerySession({
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
                if (message.type === 'CLEAR_QUERY') {
                    return new Promise<MessageResponse<boolean>>((resolve) => {
                        finishClear = resolve;
                    });
                }
                return undefined;
            },
        });
        await screen.findByText(result.answer);

        // When
        const clearButton = screen.getByRole('button', { name: 'Clear result' }) as HTMLButtonElement;
        fireEvent.click(clearButton);

        // Then
        await waitFor(() => expect(clearButton.disabled).toBe(true));
        fireEvent.click(clearButton);
        expect(messages.filter((message) => message.type === 'CLEAR_QUERY')).toHaveLength(1);

        // When / Then
        await act(async () => finishClear({ success: true, data: true }));
        await waitFor(() => expect(screen.getByTestId('result').textContent).toBe(''));
    });

    it('uses an explicit initial question instead of restoring a previous session', async () => {
        // Given
        const { messages } = renderQuerySession({ initialQuestion: 'Question from the embed caller' });

        // Then
        await waitFor(() => {
            expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe(
                'Question from the embed caller',
            );
        });
        expect(messages.some((message) => message.type === 'RESTORE_QUERY')).toBe(false);
    });

    it('does not restore a previous session over an explicit initial question on notifications', async () => {
        const { messages, transport } = renderQuerySession({ initialQuestion: 'Question from the embed caller' });

        await act(async () => {
            await transport.sendToPopup(
                {
                    type: 'QUERY_FINISHED',
                    data: { queryId: 'previous-query' },
                } as PopupMessage,
                { pageId: 42 },
            );
        });

        expect((screen.getByLabelText('Question') as HTMLInputElement).value).toBe('Question from the embed caller');
        expect(messages.some((message) => message.type === 'RESTORE_QUERY')).toBe(false);
    });

    it('does not restore a query finished on another page', async () => {
        // Given
        const { messages, transport } = renderQuerySession();
        await waitFor(() => expect(messages.some((message) => message.type === 'RESTORE_QUERY')).toBe(true));
        const restoreCount = messages.filter((message) => message.type === 'RESTORE_QUERY').length;

        // When
        await act(async () => {
            await transport.sendToPopup(
                { type: 'QUERY_FINISHED', data: { queryId: 'other-page-query' } },
                { pageId: 7 },
            );
        });

        // Then
        expect(messages.filter((message) => message.type === 'RESTORE_QUERY')).toHaveLength(restoreCount);
    });

    it('validates questions before asking the background', async () => {
        // Given
        const { messages } = renderQuerySession();

        // When
        fireEvent.click(await screen.findByRole('button', { name: 'Ask' }));

        // Then
        expect(await screen.findByText('Please enter a question')).toBeTruthy();
        expect(messages.some((message) => message.type === 'ASK_QUESTION')).toBe(false);
    });

    it('asks normalized questions and renders the result', async () => {
        // Given
        const { messages } = renderQuerySession({
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
        const { messages } = renderQuerySession({
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
        const { transport } = renderQuerySession({
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
            await transport.sendToPopup(
                {
                    type: 'QUERY_FINISHED',
                    data: { queryId: 'query-1' },
                } as PopupMessage,
                { pageId: 42 },
            );
        });

        // Then
        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
            expect(screen.getByTestId('result').textContent).toBe(result.answer);
        });
    });

    it('loads a completed query when its notification arrives before the ask response', async () => {
        // Given
        let resolveQuestion!: (response: MessageResponse<{ queryId: string }>) => void;
        const { transport } = renderQuerySession({
            initialQuestion: 'How do I open settings?',
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    return new Promise<MessageResponse<{ queryId: string }>>((resolve) => {
                        resolveQuestion = resolve;
                    });
                }
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
                return undefined;
            },
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('true'));

        // When
        await act(async () => {
            await transport.sendToPopup({ type: 'QUERY_FINISHED', data: { queryId: 'query-1' } }, { pageId: 42 });
            resolveQuestion({ success: true, data: { queryId: 'query-1' } });
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
        const { transport } = renderQuerySession({
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
            await transport.sendToPopup(
                {
                    type: 'QUERY_FINISHED',
                    data: { queryId: 'query-1' },
                } as PopupMessage,
                { pageId: 42 },
            );
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

    it('ignores an old completion restored after a newer question starts', async () => {
        // Given
        let resolveOldRestore!: (response: MessageResponse<RestoreQueryResponse>) => void;
        let askCount = 0;
        let restoreCount = 0;
        const { transport, messages } = renderQuerySession({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    askCount += 1;
                    return { success: true, data: { queryId: `query-${askCount}` } };
                }
                if (message.type === 'RESTORE_QUERY') {
                    restoreCount += 1;
                    if (restoreCount === 1) return { success: true, data: { status: 'empty' } };
                    if (restoreCount === 3) {
                        return new Promise<MessageResponse<RestoreQueryResponse>>((resolve) => {
                            resolveOldRestore = resolve;
                        });
                    }
                    const queryId = restoreCount === 2 ? 'query-1' : 'query-2';
                    return { success: true, data: { status: 'pending', queryId, data: { question: queryId } } };
                }
                return undefined;
            },
        });
        const questionInput = await screen.findByLabelText('Question');
        fireEvent.input(questionInput, { target: { value: 'First question' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(restoreCount).toBe(2));
        await act(async () => {
            await transport.sendToPopup({ type: 'QUERY_FINISHED', data: { queryId: 'query-1' } }, { pageId: 42 });
        });
        await waitFor(() => expect(restoreCount).toBe(3));

        // When
        fireEvent.input(questionInput, { target: { value: 'Second question' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(restoreCount).toBe(4));
        await act(async () => {
            resolveOldRestore({
                success: true,
                data: {
                    status: 'completed',
                    queryId: 'query-1',
                    data: { question: 'First question', result, metadata: queryResponse.metadata, trailSnapshot },
                },
            });
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        // Then
        expect(screen.getByTestId('loading').textContent).toBe('true');
        expect(screen.getByTestId('result').textContent).toBe('');
        expect(messages.some((message) => message.type === 'NAVIGATE_TO_ELEMENT')).toBe(false);
    });

    it('ignores an old question restore completed after a newer question starts', async () => {
        // Given
        let resolveOldRestore!: (response: MessageResponse<RestoreQueryResponse>) => void;
        let askCount = 0;
        let restoreCount = 0;
        renderQuerySession({
            handler: (message) => {
                if (message.type === 'ASK_QUESTION') {
                    askCount += 1;
                    return { success: true, data: { queryId: `query-${askCount}` } };
                }
                if (message.type === 'RESTORE_QUERY') {
                    restoreCount += 1;
                    if (restoreCount === 1) return { success: true, data: { status: 'empty' } };
                    if (restoreCount === 2) {
                        return new Promise<MessageResponse<RestoreQueryResponse>>((resolve) => {
                            resolveOldRestore = resolve;
                        });
                    }
                    return {
                        success: true,
                        data: { status: 'pending', queryId: 'query-2', data: { question: 'Second question' } },
                    };
                }
                return undefined;
            },
        });
        const questionInput = await screen.findByLabelText('Question');
        fireEvent.input(questionInput, { target: { value: 'First question' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(restoreCount).toBe(2));

        // When
        fireEvent.input(questionInput, { target: { value: 'Second question' } });
        fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
        await waitFor(() => expect(restoreCount).toBe(3));
        await act(async () => {
            resolveOldRestore({
                success: true,
                data: {
                    status: 'completed',
                    queryId: 'query-1',
                    data: { question: 'First question', result, metadata: queryResponse.metadata, trailSnapshot },
                },
            });
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        // Then
        expect(screen.getByTestId('loading').textContent).toBe('true');
        expect(screen.getByTestId('result').textContent).toBe('');
    });

    it('does not navigate to a result when the session unmounts before the query completes', async () => {
        // Given
        let resolveQuestion!: (response: MessageResponse<{ queryId: string }>) => void;
        const { messages, unmount } = renderQuerySession({
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

    it('does not apply a restored result after the session unmounts', async () => {
        // Given
        let resolveRestore!: (response: MessageResponse<RestoreQueryResponse>) => void;
        let restoreCount = 0;
        const { messages, unmount } = renderQuerySession({
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
        renderQuerySession({
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
        renderQuerySession({
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
});
