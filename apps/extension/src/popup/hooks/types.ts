import type { PopupExampleItem } from '#self/popup/utils/data';
import type { AgentResult, AgentResultElement } from '@flowforge/shared';

export interface QuestionState {
    question: string;
}

export interface QuestionActions {
    setQuestion: (value: string) => void;
    askQuestion: () => void;
}

export interface QuestionViewModel extends QuestionState, QuestionActions {}

export interface ExamplesState {
    examples: PopupExampleItem[];
}

export interface ExamplesActions {
    applyExampleQuestion: (question: string) => void;
}

export interface ExamplesViewModel extends ExamplesState, ExamplesActions {}

export interface ResultState {
    result: AgentResult | null;
    error: string | null;
}

export interface ResultActions {
    navigateToElement: (element: AgentResultElement) => void;
}

export interface ResultViewModel extends ResultState, ResultActions {}

export interface PopupState extends QuestionState, ExamplesState, ResultState {
    isLoading: boolean;
    copyright: string;
}

export interface PopupActions extends QuestionActions, ExamplesActions, ResultActions {}

export interface PopupViewModel extends PopupState, PopupActions {}
