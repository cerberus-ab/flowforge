import { useState, useEffect, useCallback } from 'preact/hooks';
import type {
    AskQuestionMessage,
    AskQuestionMessageResponse,
    GetPrevQuestionsMessage,
    GetPrevQuestionsMessageResponse,
    MessageResponse,
    NavigateToElementMessage,
} from '#self/types';
import { config } from '#self/config';
import { normalizeText } from '#self/core/utils/text';
import { buildPresetExampleItems, type PopupExampleItem } from '#self/popup/utils/data';
import { buildTryExampleItems } from '#self/popup/utils/data';
import type { PopupViewModel } from './usePopup.types';
import type { TransportService } from '#self/adapters/interface';
import type { AgentResult, AgentResultElement } from '@flowforge/shared';
import { formatQueryResponseMetadata } from '#self/popup/utils/format';

interface UsePopupParams {
    transport: TransportService;
    presetQuestions?: string[];
    initialQuestion?: string;
}

export function usePopup({ transport, presetQuestions, initialQuestion }: UsePopupParams): PopupViewModel {
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AgentResult | null>(null);
    const [resultMetadata, setResultMetadata] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [examples, setExamples] = useState<PopupExampleItem[]>([]);

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
                const message: GetPrevQuestionsMessage = {
                    type: 'GET_PREV_QUESTIONS',
                    senderId: await transport.getActiveSenderId(),
                };
                const response = await transport.sendToBackground<
                    GetPrevQuestionsMessage,
                    GetPrevQuestionsMessageResponse
                >(message);

                if (response.success && response.data.questions.length > 0) {
                    setExamples(buildTryExampleItems(config.exampleQuestions, response.data.questions));
                }
            } catch (err) {
                console.warn('[FlowForge] Failed to load previous questions:', err);
            }
        };

        void loadPreviousQuestions();
    }, [presetQuestions, transport]);

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

            const message: AskQuestionMessage = {
                type: 'ASK_QUESTION',
                senderId: await transport.getActiveSenderId(),
                data: { question: normalized },
            };

            const response = await transport.sendToBackground<AskQuestionMessage, AskQuestionMessageResponse>(message);

            setIsLoading(false);

            if (!response.success) {
                setError(response.error ?? 'Unknown error occurred');
                return;
            }
            if (!response.data) {
                setError('Empty response received');
                return;
            }
            setResult(response.data.result);
            setResultMetadata(formatQueryResponseMetadata(response.data.metadata));
        } catch (err) {
            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
    }, [question, transport]);

    // Handle example selection
    const handleSelectExample = useCallback((selectedQuestion: string) => {
        setQuestion(selectedQuestion);
    }, []);

    // Handle navigation to an element
    const handleNavigateToElement = useCallback(
        async (element: AgentResultElement) => {
            const message: NavigateToElementMessage = {
                type: 'NAVIGATE_TO_ELEMENT',
                senderId: await transport.getActiveSenderId(),
                data: { element },
            };
            await transport.sendToBackground<NavigateToElementMessage, MessageResponse>(message);
        },
        [transport],
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
    };
}
