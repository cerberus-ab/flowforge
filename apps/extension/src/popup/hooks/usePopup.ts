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
import type { PopupExampleItem } from '#self/popup/utils/data';
import { buildExampleItems } from '#self/popup/utils/data';
import type { PopupViewModel } from './types';
import type { TransportService } from '#self/adapters/interface';
import type { AgentResult, AgentResultElement } from '@flowforge/shared';

interface UsePopupParams {
    transport: TransportService;
}

export function usePopup({ transport }: UsePopupParams): PopupViewModel {
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AgentResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [examples, setExamples] = useState<PopupExampleItem[]>([]);

    // Initialize examples and previous questions
    useEffect(() => {
        // Set initial examples
        setExamples(buildExampleItems(config.exampleQuestions));

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
                    setExamples(buildExampleItems(config.exampleQuestions, response.data.questions));
                }
            } catch (err) {
                console.warn('[FlowForge] Failed to load previous questions:', err);
            }
        };

        void loadPreviousQuestions();
    }, [transport]);

    // Handle ask question
    const handleAskQuestion = useCallback(async () => {
        try {
            const normalized = normalizeText(question);

            if (!normalized) {
                setError('Please enter a question');
                setResult(null);
                return;
            }
            if (normalized.length > config.maxQuestionLength) {
                setError(`Please keep your question under ${config.maxQuestionLength} characters`);
                setResult(null);
                return;
            }

            setIsLoading(true);
            setError(null);
            setResult(null);

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
            setResult(response.data);
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
        error,
        examples,
        copyright: config.copyright,
        // actions
        setQuestion,
        askQuestion: handleAskQuestion,
        applyExampleQuestion: handleSelectExample,
        navigateToElement: handleNavigateToElement,
    };
}
