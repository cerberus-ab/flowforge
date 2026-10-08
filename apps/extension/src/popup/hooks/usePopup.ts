import { useState, useEffect, useCallback } from 'preact/hooks';
import { config } from '@/config';
import { normalizeText } from '@/core/utils/text';
import { buildPresetExampleItems, type PopupExampleItem } from '@/popup/utils/data';
import { buildTryExampleItems } from '@/popup/utils/data';
import type { AgentResult, AgentResultElement } from '@flowforge/contract';
import { formatQueryResponseMetadata } from '@/popup/utils/format';
import type { PopupBackgroundClient } from '@/background/client/contract';

export interface UsePopupOptions {
    backgroundClient: PopupBackgroundClient;
    presetQuestions?: string[];
    initialQuestion?: string;
}

export interface PopupViewModel {
    question: string;
    setQuestion: (value: string) => void;
    isLoading: boolean;
    result: AgentResult | null;
    resultMetadata: string | null;
    error: string | null;
    examples: PopupExampleItem[];
    copyright: string;
    github: string;
    askQuestion: () => Promise<void>;
    applyExampleQuestion: (question: string) => void;
    navigateToElement: (element: AgentResultElement) => Promise<void>;
    openPageInspector: (tab?: string) => Promise<void>;
}

export function usePopup({ backgroundClient, presetQuestions, initialQuestion }: UsePopupOptions): PopupViewModel {
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AgentResult | null>(null);
    const [resultMetadata, setResultMetadata] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [examples, setExamples] = useState<PopupExampleItem[]>([]);

    // Clear page UI state when popup opens.
    useEffect(() => {
        void (async () => {
            try {
                await backgroundClient.initializePopup();
            } catch {
                // Popup startup should not fail if the active tab cannot receive page messages.
            }
        })();
    }, [backgroundClient]);

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
                const questions = await backgroundClient.getPreviousQuestions();

                if (questions.length > 0) {
                    setExamples(buildTryExampleItems(config.exampleQuestions, questions));
                }
            } catch (err) {
                console.warn('[FlowForge] Failed to load previous questions:', err);
            }
        };

        void loadPreviousQuestions();
    }, [presetQuestions, backgroundClient]);

    // Initialize initial question if presented
    useEffect(() => {
        if (initialQuestion !== undefined) {
            setQuestion(initialQuestion);
        }
    }, [initialQuestion]);

    // Handle ask question
    const handleAskQuestion = useCallback(async () => {
        try {
            setResult(null);
            setResultMetadata(null);
            setError(null);

            const normalized = normalizeText(question);

            if (!normalized) {
                setError('Please enter a question');
                return;
            }
            if (normalized.length > config.maxQuestionLength) {
                setError(`Please keep your question under ${config.maxQuestionLength} characters`);
                return;
            }
            setIsLoading(true);

            const response = await backgroundClient.askQuestion(normalized);

            setIsLoading(false);

            if (!response) {
                setError('Empty response received');
                return;
            }
            setResult(response.result);
            setResultMetadata(formatQueryResponseMetadata(response.metadata));
        } catch (err) {
            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
    }, [question, backgroundClient]);

    // Handle example selection
    const handleSelectExample = useCallback((selectedQuestion: string) => {
        setQuestion(selectedQuestion);
    }, []);

    // Handle navigation to an element
    const handleNavigateToElement = useCallback(
        async (element: AgentResultElement) => {
            await backgroundClient.navigateToElement(element);
        },
        [backgroundClient],
    );

    // Handle open inspector
    const handleOpenPageInspector = useCallback(
        async (tab?: string) => {
            await backgroundClient.openPageInspector(tab);
        },
        [backgroundClient],
    );

    return {
        question,
        isLoading,
        result,
        resultMetadata,
        error,
        examples,
        copyright: config.copyright,
        github: config.github,
        // actions
        setQuestion,
        askQuestion: handleAskQuestion,
        applyExampleQuestion: handleSelectExample,
        navigateToElement: handleNavigateToElement,
        openPageInspector: handleOpenPageInspector,
    };
}
