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
            <div data-testid="result">{popup.result?.answer ?? ''}</div>
            <div data-testid="metadata">{popup.resultMetadata ?? ''}</div>
            <ul>
                {popup.examples.map((example) => (
                    <li key={`${example.type}:${example.question}`}>{example.question}</li>
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
