import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'preact/hooks';
import type { AgentResult, AgentResultElement } from '@flowforge/contract';

import type { PopupBackgroundClient } from '@/background';
import { config } from '@/config';
import { normalizeText } from '@/core/utils/text';
import type { RestoreQueryResponse } from '@/messaging';
import { formatQueryResponseMetadata } from '@/popup/utils/format';

interface DisplayedResult {
    queryId: string;
    result: AgentResult;
    metadata: string;
    question: string;
    isStale: boolean;
}

interface QuerySessionState {
    inputQuestion: string;
    status: 'idle' | 'submitting' | 'pending' | 'completed' | 'clearing' | 'error';
    displayedResult: DisplayedResult | null;
    error: string | null;
    clearError: string | null;
    hasEditedQuestionAfterResult: boolean;
}

type QuerySessionAction =
    | { type: 'inputChanged'; value: string }
    | { type: 'inputRestored'; value: string }
    | { type: 'started' }
    | { type: 'pending' }
    | { type: 'completed'; result: DisplayedResult }
    | { type: 'clearing' }
    | { type: 'cleared' }
    | { type: 'clearFailed'; error: string }
    | { type: 'failed'; error: string };

const initialState: QuerySessionState = {
    inputQuestion: '',
    status: 'idle',
    displayedResult: null,
    error: null,
    clearError: null,
    hasEditedQuestionAfterResult: false,
};

/** Keeps the visible query state consistent across async transitions. */
function reduceQuerySession(state: QuerySessionState, action: QuerySessionAction): QuerySessionState {
    switch (action.type) {
        case 'inputChanged':
            return {
                ...state,
                inputQuestion: action.value,
                clearError: null,
                hasEditedQuestionAfterResult: state.hasEditedQuestionAfterResult || state.displayedResult !== null,
            };
        case 'inputRestored':
            return { ...state, inputQuestion: action.value };
        case 'started':
        case 'pending':
            return {
                ...state,
                status: action.type === 'started' ? 'submitting' : 'pending',
                displayedResult: null,
                error: null,
                clearError: null,
                hasEditedQuestionAfterResult: false,
            };
        case 'completed':
            return {
                ...state,
                status: 'completed',
                displayedResult: action.result,
                error: null,
                clearError: null,
                hasEditedQuestionAfterResult: false,
            };
        case 'clearing':
            return { ...state, status: 'clearing', clearError: null };
        case 'cleared':
            return {
                ...state,
                status: 'idle',
                displayedResult: null,
                error: null,
                clearError: null,
                hasEditedQuestionAfterResult: false,
            };
        case 'clearFailed':
            return { ...state, status: 'completed', clearError: action.error };
        case 'failed':
            return {
                ...state,
                status: 'error',
                displayedResult: null,
                error: action.error,
                clearError: null,
                hasEditedQuestionAfterResult: false,
            };
    }
}

export interface QuerySessionViewModel {
    inputQuestion: string;
    question: string;
    setInputQuestion: (value: string) => void;
    isLoading: boolean;
    isClearingResult: boolean;
    result: AgentResult | null;
    resultMetadata: string | null;
    isResultStale: boolean;
    warning: string | null;
    error: string | null;
    askQuestion: () => Promise<void>;
    clearResult: () => Promise<void>;
    openOnboarding: () => Promise<void>;
    navigateToElement: (element: AgentResultElement) => Promise<void>;
}

/** Owns popup query input, persistence restoration, and result lifecycle. */
export function useQuerySession(
    backgroundClient: PopupBackgroundClient,
    initialQuestion?: string,
): QuerySessionViewModel {
    const [state, dispatch] = useReducer(reduceQuerySession, initialState);
    const isMountedRef = useRef(true);
    const hasUserEditedQuestion = useRef(false);
    // Async callbacks read these immediately, before a reducer update can render.
    const pendingQueryIdRef = useRef<string | undefined>(undefined);
    // A newer submission invalidates restores still in flight for an older question.
    const queryGenerationRef = useRef(0);
    const isSubmittingQuestionRef = useRef(false);
    // A completion may arrive before an older restore returns its pending snapshot.
    const finishedQueryIdsRef = useRef(new Set<string>());
    // If refreshing that completion fails, the older snapshot must not restart loading.
    const failedQueryRestoreIdsRef = useRef(new Set<string>());
    const clearedQueryIdsRef = useRef(new Set<string>());
    const isClearingResultRef = useRef(false);

    const question = useMemo(() => normalizeText(state.inputQuestion), [state.inputQuestion]);
    const warning =
        state.clearError ??
        (state.hasEditedQuestionAfterResult && state.displayedResult
            ? `The question has changed. This result is for the previous question: "${state.displayedResult.question}"`
            : state.displayedResult?.isStale
              ? 'This page has changed since the answer was generated. Element references may be outdated.'
              : null);

    const navigateToElement = useCallback(
        (element: AgentResultElement) => backgroundClient.navigateToElement(element),
        [backgroundClient],
    );

    const applyQuerySession = useCallback(
        (response: RestoreQueryResponse, shouldRestoreQuestion: boolean) => {
            if (response.status === 'empty') return;
            if (clearedQueryIdsRef.current.has(response.queryId)) return;
            // Do not put the popup back into loading after this query has finished.
            if (response.status === 'pending' && finishedQueryIdsRef.current.has(response.queryId)) {
                if (failedQueryRestoreIdsRef.current.has(response.queryId)) {
                    pendingQueryIdRef.current = undefined;
                    dispatch({
                        type: 'failed',
                        error: 'The query finished, but its result could not be loaded. Reopen the popup to try again.',
                    });
                }
                return;
            }

            if (shouldRestoreQuestion) dispatch({ type: 'inputRestored', value: response.data.question });

            if (response.status === 'pending') {
                pendingQueryIdRef.current = response.queryId;
                dispatch({ type: 'pending' });
                return;
            }

            // Only a result awaited by this popup may navigate automatically.
            const shouldAutoNavigate =
                response.status === 'completed' && pendingQueryIdRef.current === response.queryId;
            pendingQueryIdRef.current = undefined;
            if ('error' in response.data) {
                dispatch({ type: 'failed', error: response.data.error });
                return;
            }

            dispatch({
                type: 'completed',
                result: {
                    queryId: response.queryId,
                    result: response.data.result,
                    metadata: formatQueryResponseMetadata(response.data.metadata),
                    question: response.data.question,
                    isStale: response.status === 'stale',
                },
            });
            if (
                shouldAutoNavigate &&
                response.data.result.mode === 'direct' &&
                response.data.result.elements.length === 1
            ) {
                void navigateToElement(response.data.result.elements[0]!);
            }
        },
        [navigateToElement],
    );

    const setInputQuestion = useCallback((value: string) => {
        hasUserEditedQuestion.current = true;
        dispatch({ type: 'inputChanged', value });
    }, []);

    useLayoutEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Subscribe before restoring so a completion during startup is not missed.
    useEffect(() => {
        let isActive = true;
        const unsubscribe = backgroundClient.subscribeToPopupMessages({
            onQueryFinished: ({ queryId }) => {
                if (clearedQueryIdsRef.current.has(queryId)) return;
                finishedQueryIdsRef.current.add(queryId);
                // The restore after askQuestion returns will pick up an early completion.
                if (isSubmittingQuestionRef.current) return;
                if (pendingQueryIdRef.current !== undefined && pendingQueryIdRef.current !== queryId) return;
                // An explicit initial question must not adopt an older page session.
                if (initialQuestion !== undefined && pendingQueryIdRef.current !== queryId) return;

                const generation = queryGenerationRef.current;
                void backgroundClient
                    .restoreQuery()
                    .then((response) => {
                        if (!isActive || queryGenerationRef.current !== generation) return;
                        if (response.status === 'empty' || response.queryId !== queryId) {
                            failedQueryRestoreIdsRef.current.add(queryId);
                            if (pendingQueryIdRef.current === queryId) {
                                pendingQueryIdRef.current = undefined;
                                dispatch({
                                    type: 'failed',
                                    error: 'The query is no longer available. Please try again.',
                                });
                            }
                            return;
                        }
                        if (response.status === 'pending') {
                            failedQueryRestoreIdsRef.current.add(queryId);
                            if (pendingQueryIdRef.current === queryId) {
                                pendingQueryIdRef.current = undefined;
                                dispatch({
                                    type: 'failed',
                                    error: 'The query finished, but its result could not be saved. Please try again.',
                                });
                            }
                            return;
                        }
                        failedQueryRestoreIdsRef.current.delete(queryId);
                        applyQuerySession(response, !hasUserEditedQuestion.current);
                    })
                    .catch((err) => {
                        if (!isActive || queryGenerationRef.current !== generation) return;
                        console.warn('[FlowForge] Failed to refresh query session:', err);
                        failedQueryRestoreIdsRef.current.add(queryId);
                        if (pendingQueryIdRef.current === queryId) {
                            pendingQueryIdRef.current = undefined;
                            dispatch({
                                type: 'failed',
                                error: 'The query finished, but its result could not be loaded. Reopen the popup to try again.',
                            });
                        }
                    });
            },
        });

        // Without an explicit question, restore the session saved for this page.
        if (initialQuestion === undefined) {
            const generation = queryGenerationRef.current;
            void backgroundClient
                .restoreQuery()
                .then((response) => {
                    if (!isActive || queryGenerationRef.current !== generation || hasUserEditedQuestion.current) return;
                    applyQuerySession(response, true);
                })
                .catch((err) => {
                    if (isActive) console.warn('[FlowForge] Failed to restore query session:', err);
                });
        }

        return () => {
            isActive = false;
            unsubscribe();
        };
    }, [backgroundClient, initialQuestion, applyQuerySession]);

    useEffect(() => {
        if (initialQuestion !== undefined) {
            hasUserEditedQuestion.current = false;
            dispatch({ type: 'inputRestored', value: initialQuestion });
        }
    }, [initialQuestion]);

    const askQuestion = useCallback(async () => {
        if (!question) {
            dispatch({ type: 'failed', error: 'Please enter a question' });
            return;
        }
        if (question.length > config.maxQuestionLength) {
            dispatch({
                type: 'failed',
                error: `Please keep your question under ${config.maxQuestionLength} characters`,
            });
            return;
        }
        const generation = ++queryGenerationRef.current;
        isSubmittingQuestionRef.current = true;
        pendingQueryIdRef.current = undefined;
        dispatch({ type: 'started' });

        try {
            const response = await backgroundClient.askQuestion(question);
            if (!isMountedRef.current || queryGenerationRef.current !== generation) return;
            isSubmittingQuestionRef.current = false;
            pendingQueryIdRef.current = response.queryId;

            // Also catches a completion that arrived before the query ID was known.
            const session = await backgroundClient.restoreQuery();
            if (!isMountedRef.current || queryGenerationRef.current !== generation) return;
            if (session.status === 'empty' || session.queryId !== response.queryId) {
                pendingQueryIdRef.current = undefined;
                dispatch({ type: 'failed', error: 'The query is no longer available. Please try again.' });
                return;
            }
            if (session.status === 'pending' && finishedQueryIdsRef.current.has(response.queryId)) {
                pendingQueryIdRef.current = undefined;
                failedQueryRestoreIdsRef.current.add(response.queryId);
                dispatch({
                    type: 'failed',
                    error: 'The query finished, but its result could not be saved. Please try again.',
                });
                return;
            }
            applyQuerySession(session, false);
        } catch (err) {
            if (!isMountedRef.current || queryGenerationRef.current !== generation) return;
            isSubmittingQuestionRef.current = false;
            pendingQueryIdRef.current = undefined;
            dispatch({ type: 'failed', error: err instanceof Error ? err.message : 'Unknown error occurred' });
        }
    }, [question, backgroundClient, applyQuerySession]);

    const clearResult = useCallback(async () => {
        const queryId = state.displayedResult?.queryId;
        if (queryId === undefined || isClearingResultRef.current) return;

        isClearingResultRef.current = true;
        const generation = ++queryGenerationRef.current;
        clearedQueryIdsRef.current.add(queryId);
        dispatch({ type: 'clearing' });

        try {
            await backgroundClient.clearQuery(queryId);
            if (isMountedRef.current && queryGenerationRef.current === generation) dispatch({ type: 'cleared' });
        } catch {
            clearedQueryIdsRef.current.delete(queryId);
            if (isMountedRef.current && queryGenerationRef.current === generation) {
                dispatch({ type: 'clearFailed', error: 'Could not clear this result. Please try again.' });
            }
        } finally {
            isClearingResultRef.current = false;
        }
    }, [state.displayedResult, backgroundClient]);

    const openOnboarding = useCallback(async () => {
        if (!state.displayedResult) return;
        await backgroundClient.openOnboarding(state.displayedResult.question, state.displayedResult.result);
    }, [state.displayedResult, backgroundClient]);

    return {
        inputQuestion: state.inputQuestion,
        question,
        setInputQuestion,
        isLoading: state.status === 'submitting' || state.status === 'pending',
        isClearingResult: state.status === 'clearing',
        result: state.displayedResult?.result ?? null,
        resultMetadata: state.displayedResult?.metadata ?? null,
        isResultStale: state.displayedResult?.isStale ?? false,
        warning,
        error: state.error,
        askQuestion,
        clearResult,
        openOnboarding,
        navigateToElement,
    };
}
