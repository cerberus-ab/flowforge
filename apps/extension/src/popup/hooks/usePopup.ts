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
    openPageInspector: (tab?: string) => Promise<void>;
}

export function usePopup({ backgroundClient, presetQuestions, initialQuestion }: UsePopupOptions): PopupViewModel {
    // Clear page UI state before restoring the query session.
    useEffect(() => {
        void backgroundClient.notifyPopupOpened().catch(() => {
            // Popup startup should not fail if the active tab cannot receive page messages.
        });
    }, [backgroundClient]);

    const querySession = useQuerySession(backgroundClient, initialQuestion);
    const [examples, setExamples] = useState<PopupExampleItem[]>([]);

    useEffect(() => {
        if (presetQuestions && presetQuestions.length > 0) {
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
    }, [presetQuestions, backgroundClient]);

    const openPageInspector = useCallback(
        (tab?: string) => backgroundClient.openPageInspector(tab),
        [backgroundClient],
    );

    return {
        ...querySession,
        examples,
        copyright: config.copyright,
        github: config.github,
        applyExampleQuestion: querySession.setInputQuestion,
        openPageInspector,
    };
}
