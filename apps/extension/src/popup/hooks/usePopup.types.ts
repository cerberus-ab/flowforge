import type { PopupExampleItem } from '#self/popup/utils/data';
import type { AgentResult, AgentResultElement } from '@flowforge/shared';

export interface QuestionState {
    question: string;
}

export interface QuestionActions {
    setQuestion: (value: string) => void;
    askQuestion: () => void;
}

export type QuestionViewModel = QuestionState & QuestionActions;

export interface ExamplesState {
    examples: PopupExampleItem[];
}

export interface ExamplesActions {
    applyExampleQuestion: (question: string) => void;
}

export type ExamplesViewModel = ExamplesState & ExamplesActions;

export interface ResultState {
    result: AgentResult | null;
    resultMetadata: string | null;
    error: string | null;
}

export interface ResultActions {
    navigateToElement: (element: AgentResultElement) => void;
}

export type ResultViewModel = ResultState & ResultActions;

export interface PopupState extends QuestionState, ExamplesState, ResultState {
    isLoading: boolean;
    copyright: string;
    github: string;
}

export type PopupActions = QuestionActions & ExamplesActions & ResultActions;

export type PopupViewModel = PopupState & PopupActions;
