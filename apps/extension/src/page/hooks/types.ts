import type { AgentResultElement } from '@flowforge/shared';

export interface HighlightState {
    id: string;
    el: Element;
    element: AgentResultElement;
    stepIndex?: number;
    duration: number;
}

export interface HighlightActions {
    remove: () => void;
}

export interface HighlightViewModel extends HighlightState, HighlightActions {}

export interface WizardState {
    title: string;
    description: string;
    steps: AgentResultElement[];
    currentStep: number;
}

export interface WizardActions {
    close: () => void;
    changeStep: (step: number) => void;
}

export interface WizardViewModel extends WizardState, WizardActions {}

export interface PageViewModel {
    highlights: HighlightViewModel[];
    wizard: WizardViewModel | null;
}
