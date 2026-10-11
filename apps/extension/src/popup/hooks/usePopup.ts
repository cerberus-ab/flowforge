import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'preact/hooks';
import { config } from '@/config';
import { normalizeText } from '@/core/utils/text';
import { buildPresetExampleItems, type PopupExampleItem } from '@/popup/utils/data';
import { buildTryExampleItems } from '@/popup/utils/data';
import type { AgentResult, AgentResultElement } from '@flowforge/contract';
import { formatQueryResponseMetadata } from '@/popup/utils/format';
import type { PopupBackgroundClient } from '@/background';

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
    const [error, setError] = useState<string | null>(null);
    const [examples, setExamples] = useState<PopupExampleItem[]>([]);

    const setInputQuestion = useCallback((value: string) => {
        hasUserEditedQuestion.current = true;
        setInputQuestionState(value);
    }, []);

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

    // Restore the saved query independently from loading question-history examples.
    useEffect(() => {
        if (initialQuestion !== undefined) return;

        let isActive = true;
        void backgroundClient
            .restoreQuery()
            .then((response) => {
                if (!isActive || !isMountedRef.current || hasUserEditedQuestion.current || !response.restored) return;

                setInputQuestionState(response.data.question);
                setError(null);
                setIsLoading(false);

                if (response.state === 'completed') {
                    setResult(response.data.result);
                    setResultMetadata(formatQueryResponseMetadata(response.data.metadata));
                }
            })
            .catch((err) => {
                if (isActive) console.warn('[FlowForge] Failed to restore query session:', err);
            });

        return () => {
            isActive = false;
        };
    }, [backgroundClient, initialQuestion]);

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

            setIsLoading(false);

            if (!response) {
                setError('Empty response received');
                return;
            }
            setResult(response.result);
            setResultMetadata(formatQueryResponseMetadata(response.metadata));

            // Auto navigate to the element in direct mode
            if (response.result.mode === 'direct' && response.result.elements.length === 1) {
                void handleNavigateToElement(response.result.elements[0]!);
            }
        } catch (err) {
            if (!isMountedRef.current) return;

            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
    }, [question, backgroundClient]);

    // Handle example selection
    const handleSelectExample = useCallback(
        (selectedQuestion: string) => {
            setInputQuestion(selectedQuestion);
        },
        [setInputQuestion],
    );

    // Handle navigation to an element
    const handleNavigateToElement = useCallback(
        async (element: AgentResultElement) => {
            await backgroundClient.navigateToElement(element);
        },
        [backgroundClient],
    );

    // Handle open onboarding
    const handleOpenOnboarding = useCallback(async () => {
        if (!result) return;
        await backgroundClient.openOnboarding(question, result);
    }, [question, result, backgroundClient]);

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
