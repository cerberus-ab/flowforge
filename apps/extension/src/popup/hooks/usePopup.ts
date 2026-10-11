import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'preact/hooks';
import { config } from '@/config';
import { normalizeText } from '@/core/utils/text';
import { buildPresetExampleItems, buildTryExampleItems, type PopupExampleItem } from '@/popup/utils/data';
import type { AgentResult, AgentResultElement } from '@flowforge/contract';
import { formatQueryResponseMetadata } from '@/popup/utils/format';
import type { PopupBackgroundClient } from '@/background';
import type { RestoreQueryResponse } from '@/messaging';

export interface UsePopupOptions {
    backgroundClient: PopupBackgroundClient;
    presetQuestions?: string[];
    initialQuestion?: string;
}

export interface PopupViewModel {
    question: string;
    inputQuestion: string;
    setInputQuestion: (value: string) => void;
    isLoading: boolean;
    result: AgentResult | null;
    resultMetadata: string | null;
    isResultStale: boolean;
    warning: string | null;
    error: string | null;
    examples: PopupExampleItem[];
    copyright: string;
    github: string;
    askQuestion: () => Promise<void>;
    openOnboarding: () => Promise<void>;
    applyExampleQuestion: (question: string) => void;
    navigateToElement: (element: AgentResultElement) => Promise<void>;
    openPageInspector: (tab?: string) => Promise<void>;
}

export function usePopup({ backgroundClient, presetQuestions, initialQuestion }: UsePopupOptions): PopupViewModel {
    const [inputQuestion, setInputQuestionState] = useState('');
    const isMountedRef = useRef(true);
    const hasUserEditedQuestion = useRef(false);
    const question = useMemo(() => normalizeText(inputQuestion), [inputQuestion]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AgentResult | null>(null);
    const [resultMetadata, setResultMetadata] = useState<string | null>(null);
    const [isResultStale, setIsResultStale] = useState(false);
    const [hasEditedQuestionAfterResult, setHasEditedQuestionAfterResult] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [examples, setExamples] = useState<PopupExampleItem[]>([]);
    const [resultQuestion, setResultQuestion] = useState<string | null>(null);
    const pendingQueryIdRef = useRef<string | undefined>(undefined);
    const finishedQueryIdsRef = useRef(new Set<string>());
    const failedQueryRestoreIdsRef = useRef(new Set<string>());
    const warning = hasEditedQuestionAfterResult
        ? `The question has changed. This result is for the previous question: "${resultQuestion}"`
        : isResultStale
          ? 'This page has changed since the answer was generated. Element references may be outdated.'
          : null;

    const handleNavigateToElement = useCallback(
        (element: AgentResultElement) => backgroundClient.navigateToElement(element),
        [backgroundClient],
    );

    const applyQuerySession = useCallback(
        (response: RestoreQueryResponse, shouldRestoreQuestion: boolean) => {
            if (response.status === 'empty') return;
            if (response.status === 'pending' && finishedQueryIdsRef.current.has(response.queryId)) {
                if (failedQueryRestoreIdsRef.current.has(response.queryId)) {
                    pendingQueryIdRef.current = undefined;
                    setIsLoading(false);
                    setError('The query finished, but its result could not be loaded. Reopen the popup to try again.');
                }
                return;
            }

            if (shouldRestoreQuestion) {
                setInputQuestionState(response.data.question);
            }
            setError(null);

            if (response.status === 'pending') {
                pendingQueryIdRef.current = response.queryId;
                setIsLoading(true);
                setResult(null);
                setResultMetadata(null);
                setResultQuestion(null);
                setIsResultStale(false);
                setHasEditedQuestionAfterResult(false);
                return;
            }

            const shouldAutoNavigate =
                response.status === 'completed' && pendingQueryIdRef.current === response.queryId;
            pendingQueryIdRef.current = undefined;
            setIsLoading(false);
            setIsResultStale(response.status === 'stale');
            setHasEditedQuestionAfterResult(false);
            if ('error' in response.data) {
                setResult(null);
                setResultMetadata(null);
                setResultQuestion(null);
                setIsResultStale(false);
                setError(response.data.error);
                return;
            }

            setResult(response.data.result);
            setResultMetadata(formatQueryResponseMetadata(response.data.metadata));
            setResultQuestion(response.data.question);
            if (
                shouldAutoNavigate &&
                response.data.result.mode === 'direct' &&
                response.data.result.elements.length === 1
            ) {
                void handleNavigateToElement(response.data.result.elements[0]!);
            }
        },
        [handleNavigateToElement],
    );

    const setInputQuestion = useCallback(
        (value: string) => {
            hasUserEditedQuestion.current = true;
            if (resultQuestion !== null) setHasEditedQuestionAfterResult(true);
            setInputQuestionState(value);
        },
        [resultQuestion],
    );

    useLayoutEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Clear page UI state when popup opens.
    useEffect(() => {
        void backgroundClient.notifyPopupOpened().catch(() => {
            // Popup startup should not fail if the active tab cannot receive page messages.
        });
    }, [backgroundClient]);

    // Listen before restoring so a completion between subscription and restore is not missed.
    useEffect(() => {
        let isActive = true;
        const unsubscribe = backgroundClient.subscribeToQueryFinishedMessages({
            onQueryFinished: ({ queryId }) => {
                finishedQueryIdsRef.current.add(queryId);
                if (initialQuestion !== undefined && pendingQueryIdRef.current !== queryId) return;

                void backgroundClient
                    .restoreQuery()
                    .then((response) => {
                        if (!isActive || !isMountedRef.current) return;
                        if (response.status === 'empty' || response.queryId !== queryId) {
                            failedQueryRestoreIdsRef.current.add(queryId);
                            if (pendingQueryIdRef.current === queryId) {
                                pendingQueryIdRef.current = undefined;
                                setIsLoading(false);
                                setError('The query is no longer available. Please try again.');
                            }
                            return;
                        }
                        failedQueryRestoreIdsRef.current.delete(queryId);
                        applyQuerySession(response, !hasUserEditedQuestion.current);
                    })
                    .catch((err) => {
                        if (!isActive || !isMountedRef.current) return;
                        console.warn('[FlowForge] Failed to refresh query session:', err);
                        failedQueryRestoreIdsRef.current.add(queryId);
                        if (pendingQueryIdRef.current === queryId) {
                            pendingQueryIdRef.current = undefined;
                            setIsLoading(false);
                            setError(
                                'The query finished, but its result could not be loaded. Reopen the popup to try again.',
                            );
                        }
                    });
            },
        });

        if (initialQuestion === undefined) {
            void backgroundClient
                .restoreQuery()
                .then((response) => {
                    if (!isActive || !isMountedRef.current || hasUserEditedQuestion.current) return;
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

    // Initialize questions examples
    useEffect(() => {
        if (presetQuestions && presetQuestions.length > 0) {
            setExamples(buildPresetExampleItems(presetQuestions));
            return;
        }
        // Set initial examples
        setExamples(buildTryExampleItems(config.exampleQuestions));

        // Load previous questions
        const loadPreviousQuestions = async () => {
            try {
                const questions = (await backgroundClient.getPreviousQuestions()).questions;

                if (isMountedRef.current && questions.length > 0) {
                    setExamples(buildTryExampleItems(config.exampleQuestions, questions));
                }
            } catch (err) {
                if (isMountedRef.current) console.warn('[FlowForge] Failed to load previous questions:', err);
            }
        };

        void loadPreviousQuestions();
    }, [presetQuestions, backgroundClient]);

    // Initialize initial question if presented
    useEffect(() => {
        if (initialQuestion !== undefined) {
            hasUserEditedQuestion.current = false;
            setInputQuestionState(initialQuestion);
        }
    }, [initialQuestion]);

    // Handle ask question
    const handleAskQuestion = useCallback(async () => {
        try {
            setResult(null);
            setResultMetadata(null);
            setResultQuestion(null);
            setIsResultStale(false);
            setHasEditedQuestionAfterResult(false);
            setError(null);

            if (!question) {
                setError('Please enter a question');
                return;
            }
            if (question.length > config.maxQuestionLength) {
                setError(`Please keep your question under ${config.maxQuestionLength} characters`);
                return;
            }
            setIsLoading(true);

            const response = await backgroundClient.askQuestion(question);

            if (!isMountedRef.current) return;
            pendingQueryIdRef.current = response.queryId;

            const session = await backgroundClient.restoreQuery();
            if (!isMountedRef.current) return;
            if (session.status === 'empty' || session.queryId !== response.queryId) {
                pendingQueryIdRef.current = undefined;
                setIsLoading(false);
                setError('The query is no longer available. Please try again.');
                return;
            }
            applyQuerySession(session, false);
        } catch (err) {
            if (!isMountedRef.current) return;

            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
    }, [question, backgroundClient, applyQuerySession]);

    // Handle example selection
    const handleSelectExample = useCallback(
        (selectedQuestion: string) => {
            setInputQuestion(selectedQuestion);
        },
        [setInputQuestion],
    );

    // Handle open onboarding
    const handleOpenOnboarding = useCallback(async () => {
        if (!result || resultQuestion === null) return;
        await backgroundClient.openOnboarding(resultQuestion, result);
    }, [resultQuestion, result, backgroundClient]);

    // Handle open inspector
    const handleOpenPageInspector = useCallback(
        async (tab?: string) => {
            await backgroundClient.openPageInspector(tab);
        },
        [backgroundClient],
    );

    return {
        question,
        inputQuestion,
        isLoading,
        result,
        resultMetadata,
        isResultStale,
        warning,
        error,
        examples,
        copyright: config.copyright,
        github: config.github,
        // actions
        setInputQuestion,
        askQuestion: handleAskQuestion,
        openOnboarding: handleOpenOnboarding,
        applyExampleQuestion: handleSelectExample,
        navigateToElement: handleNavigateToElement,
        openPageInspector: handleOpenPageInspector,
    };
}
