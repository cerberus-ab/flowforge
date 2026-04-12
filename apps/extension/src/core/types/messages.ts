import type { AgentResult, AgentResultElement, AgentResultMode, PageData } from '@flowforge/shared';

type MessageTypePopupToBackground = 'ASK_QUESTION' | 'GET_PREV_QUESTIONS' | 'NAVIGATE_TO_ELEMENT';
type MessageTypeBackgroundToPage = 'COLLECT_PAGE_DATA' | 'START_ONBOARDING' | 'HIGHLIGHT_ELEMENT' | 'CLEAR_PAGE';

type MessageType = MessageTypePopupToBackground | MessageTypeBackgroundToPage;

export type Message<T = undefined> = T extends undefined ? { type: MessageType } : { type: MessageType; data: T };

export type MessageResponse<T = undefined> =
    | (T extends undefined ? { success: true } : { success: true; data: T })
    | { success: false; error: string };

// Popup -> Background

export interface AskQuestionMessageData {
    question: string;
}

export type AskQuestionMessage = Message<AskQuestionMessageData> & {
    type: 'ASK_QUESTION';
    senderId: number;
};

export type AskQuestionMessageResponseData = AgentResult;

export type AskQuestionMessageResponse = MessageResponse<AskQuestionMessageResponseData>;

export type GetPrevQuestionsMessage = Message & {
    type: 'GET_PREV_QUESTIONS';
    senderId: number;
};

export interface GetPrevQuestionsMessageResponseData {
    questions: string[];
}

export type GetPrevQuestionsMessageResponse = MessageResponse<GetPrevQuestionsMessageResponseData>;

export interface NavigateToElementMessageData {
    element: AgentResultElement;
}

export type NavigateToElementMessage = Message<NavigateToElementMessageData> & {
    type: 'NAVIGATE_TO_ELEMENT';
    senderId: number;
};

// Background -> Page

export type CollectPageDataMessage = Message & {
    type: 'COLLECT_PAGE_DATA';
};

export type CollectPageDataMessageResponseData = PageData;

export type CollectPageDataMessageResponse = MessageResponse<CollectPageDataMessageResponseData>;

export interface StartOnboardingMessageData {
    title: string;
    description: string;
    mode: AgentResultMode;
    elements: AgentResultElement[];
}

export type StartOnboardingMessage = Message<StartOnboardingMessageData> & {
    type: 'START_ONBOARDING';
};

export type ClearPageMessage = Message & {
    type: 'CLEAR_PAGE';
};

export interface HighlightElementMessageData {
    element: AgentResultElement;
}

export type HighlightElementMessage = Message<HighlightElementMessageData> & {
    type: 'HIGHLIGHT_ELEMENT';
};

// Type guards

export function isAskQuestionMessage(message: Message): message is AskQuestionMessage {
    return message.type === 'ASK_QUESTION';
}

export function isGetPrevQuestionsMessage(message: Message): message is GetPrevQuestionsMessage {
    return message.type === 'GET_PREV_QUESTIONS';
}

export function isCollectPageDataMessage(message: Message): message is CollectPageDataMessage {
    return message.type === 'COLLECT_PAGE_DATA';
}

export function isStartOnboardingMessage(message: Message): message is StartOnboardingMessage {
    return message.type === 'START_ONBOARDING';
}

export function isClearPageMessage(message: Message): message is ClearPageMessage {
    return message.type === 'CLEAR_PAGE';
}

export function isNavigateToElementMessage(message: Message): message is NavigateToElementMessage {
    return message.type === 'NAVIGATE_TO_ELEMENT';
}

export function isHighlightElementMessage(message: Message): message is HighlightElementMessage {
    return message.type === 'HIGHLIGHT_ELEMENT';
}
