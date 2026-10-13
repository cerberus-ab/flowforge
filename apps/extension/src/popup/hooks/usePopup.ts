import { useCallback, useEffect, useState } from 'preact/hooks';

import type { PopupBackgroundClient } from '@/background';
import { config } from '@/config';
import { buildPresetExampleItems, buildTryExampleItems, type PopupExampleItem } from '@/popup/utils/data';
import { useQuerySession, type QuerySessionViewModel } from './useQuerySession';

export interface UsePopupOptions {
    backgroundClient: PopupBackgroundClient;
    presetQuestions?: string[];
    initialQuestion?: string;
}

export interface PopupViewModel extends QuerySessionViewModel {
    examples: PopupExampleItem[];
    copyright: string;
    github: string;
    applyExampleQuestion: (question: string) => void;
    askPresetQuestion: () => Promise<void>;
    isUnavailableQuestion: boolean;
    presetSubmitLabel: string;
    openPageInspector: (tab?: string) => Promise<void>;
}

/** Combines query-session behavior with popup examples and preset question cycling. */
export function usePopup({ backgroundClient, presetQuestions, initialQuestion }: UsePopupOptions): PopupViewModel {
    const querySession = useQuerySession(backgroundClient, initialQuestion);
    const [examples, setExamples] = useState<PopupExampleItem[]>([]);
    // for preset questions lifecycle
    const [nextPresetIndex, setNextPresetIndex] = useState<number | undefined>(undefined);
    const selectedPresetIndex = presetQuestions?.indexOf(querySession.inputQuestion) ?? -1;
    const isUnavailableQuestion =
        presetQuestions !== undefined && querySession.inputQuestion.length > 0 && selectedPresetIndex < 0;
    const upcomingPresetIndex = nextPresetIndex ?? Math.max(selectedPresetIndex, 0);
    const presetSubmitLabel =
        querySession.inputQuestion && presetQuestions?.[upcomingPresetIndex] === querySession.inputQuestion
            ? 'Ask question'
            : 'Ask next question';

    // Initialization
    useEffect(() => {
        void backgroundClient.notifyPopupOpened().catch((err) => {
            console.warn('[FlowForge] Could not receive ack from background on initialization', err);
        });
    }, [backgroundClient]);

    // Shows preset questions or loads regular-mode suggestions with question history
    useEffect(() => {
        if (presetQuestions !== undefined) {
            setExamples(buildPresetExampleItems(presetQuestions));
            return;
        }
        let isActive = true;
        setExamples(buildTryExampleItems(config.exampleQuestions));
        void backgroundClient
            .getPreviousQuestions()
            .then(({ questions }) => {
                if (isActive && questions.length > 0) {
                    setExamples(buildTryExampleItems(config.exampleQuestions, questions));
                }
            })
            .catch((err) => {
                if (isActive) console.warn('[FlowForge] Failed to load previous questions:', err);
            });

        return () => {
            isActive = false;
        };
    }, [backgroundClient, presetQuestions]);

    // A newly supplied initial question starts a new cycle
    useEffect(() => {
        setNextPresetIndex(undefined);
    }, [initialQuestion]);

    // Opens page inspector
    const openPageInspector = useCallback(
        (tab?: string) => backgroundClient.openPageInspector(tab),
        [backgroundClient],
    );

    // Selects an example and makes that preset the next question to submit
    const applyExampleQuestion = useCallback(
        (question: string) => {
            if (presetQuestions?.length) {
                const selectedIndex = presetQuestions.indexOf(question);
                setNextPresetIndex(selectedIndex < 0 ? undefined : selectedIndex);
            }
            querySession.setInputQuestion(question);
        },
        [presetQuestions, querySession.setInputQuestion],
    );

    // Submits the shown preset first, then advances through the preset questions
    const askPresetQuestion = useCallback(async () => {
        if (!presetQuestions?.length || isUnavailableQuestion) return;

        const presetQuestion = presetQuestions[upcomingPresetIndex]!;
        setNextPresetIndex((upcomingPresetIndex + 1) % presetQuestions.length);
        querySession.setInputQuestion(presetQuestion);
        await querySession.askQuestion(presetQuestion);
    }, [
        presetQuestions,
        isUnavailableQuestion,
        upcomingPresetIndex,
        querySession.setInputQuestion,
        querySession.askQuestion,
    ]);

    // Clears the result and lets the still-visible question be submitted again
    const clearResult = useCallback(async () => {
        await querySession.clearResult();
        setNextPresetIndex(undefined);
    }, [querySession.clearResult]);

    return {
        ...querySession,
        error: isUnavailableQuestion ? "This question isn't available. Choose one below." : querySession.error,
        clearResult,
        examples,
        isUnavailableQuestion,
        copyright: config.copyright,
        github: config.github,
        applyExampleQuestion,
        askPresetQuestion,
        presetSubmitLabel,
        openPageInspector,
    };
}
