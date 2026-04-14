import type { AgentResultElement, AgentResultMode, PageData, QueryResponse } from '@flowforge/shared';
import type { ExtensionSettings } from '#self/core/types/settings';

type MessageTypeToBackground = 'GET_SETTINGS';
type MessageTypePopupToBackground = 'ASK_QUESTION' | 'GET_PREV_QUESTIONS' | 'NAVIGATE_TO_ELEMENT' | 'UPDATE_SETTINGS';
type MessageTypeBackgroundToPage = 'COLLECT_PAGE_DATA' | 'START_ONBOARDING' | 'HIGHLIGHT_ELEMENT' | 'CLEAR_PAGE' | 'APPLY_SETTINGS';

type MessageType = MessageTypeToBackground | MessageTypePopupToBackground | MessageTypeBackgroundToPage;

export type Message<T = undefined> = T extends undefined ? { type: MessageType } : { type: MessageType; data: T };

export type MessageResponse<T = undefined> =
    | (T extends undefined ? { success: true } : { success: true; data: T })
    | { success: false; error: string };

// Popup, Page -> Background

export type GetSettingsMessage = Message & {
    type: 'GET_SETTINGS';
}

export type GetSettingsMessageResponseData = ExtensionSettings;

export type GetSettingsMessageResponse = MessageResponse<GetSettingsMessageResponseData>;

// Popup -> Background

export type UpdateSettingsMessageData = {
    patch: Partial<ExtensionSettings>;
}

export type UpdateSettingsMessage = Message<UpdateSettingsMessageData> & {
    type: 'UPDATE_SETTINGS';
    senderId: number;
};

export type UpdateSettingsMessageResponseData = ExtensionSettings;

export type UpdateSettingsMessageResponse = MessageResponse<UpdateSettingsMessageResponseData>;

export interface AskQuestionMessageData {
    question: string;
}

export type AskQuestionMessage = Message<AskQuestionMessageData> & {
    type: 'ASK_QUESTION';
    senderId: number;
};

export type AskQuestionMessageResponseData = QueryResponse;

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

export interface ApplySettingsMessageData {
    settings: ExtensionSettings;
}

export type ApplySettingsMessage = Message<ApplySettingsMessageData> & {
    type: 'APPLY_SETTINGS';
};

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

export function isGetSettingsMessage(message: Message): message is GetSettingsMessage {
    return message.type === 'GET_SETTINGS';
}

export function isUpdateSettingsMessage(message: Message): message is UpdateSettingsMessage {
    return message.type === 'UPDATE_SETTINGS';
}

export function isApplySettingsMessage(message: Message): message is ApplySettingsMessage {
    return message.type === 'APPLY_SETTINGS';
}

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
