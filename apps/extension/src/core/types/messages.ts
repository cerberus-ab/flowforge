import type { AgentResultElement, AgentResultMode, PageTrail, QueryResponse } from '@flowforge/contract';
import type { ExtensionSettings } from '@/core/types/settings';

type MessageTypeToBackground = 'GET_SETTINGS' | 'UPDATE_SETTINGS';

type MessageTypePopupToBackground =
    'POPUP_INITIALISE' | 'ASK_QUESTION' | 'GET_PREV_QUESTIONS' | 'NAVIGATE_TO_ELEMENT' | 'OPEN_PAGE_INSPECTOR';

type MessageTypeBackgroundToPage =
    | 'COLLECT_PAGE_TRAIL'
    | 'START_ONBOARDING'
    | 'HIGHLIGHT_ELEMENT'
    | 'CLEAR_PAGE'
    | 'OPEN_INSPECTOR'
    | 'SETTINGS_UPDATED';

type MessageType = MessageTypeToBackground | MessageTypePopupToBackground | MessageTypeBackgroundToPage;

export type Message<T = undefined> = T extends undefined ? { type: MessageType } : { type: MessageType; data: T };

export type MessageResponse<T = undefined> =
    (T extends undefined ? { success: true } : { success: true; data: T }) | { success: false; error: string };

// Popup, Page -> Background

export type GetSettingsMessage = Message & {
    type: 'GET_SETTINGS';
};

export type GetSettingsMessageResponseData = ExtensionSettings;

export type GetSettingsMessageResponse = MessageResponse<GetSettingsMessageResponseData>;

export type UpdateSettingsMessageData = {
    patch: Partial<ExtensionSettings>;
};

export type UpdateSettingsMessage = Message<UpdateSettingsMessageData> & {
    type: 'UPDATE_SETTINGS';
    senderId?: number;
};

export type UpdateSettingsMessageResponseData = ExtensionSettings;

export type UpdateSettingsMessageResponse = MessageResponse<UpdateSettingsMessageResponseData>;

// Popup -> Background

export type PopupInitializeMessage = Message & {
    type: 'POPUP_INITIALISE';
    senderId: number;
};

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

export interface OpenPageInspectorMessageData {
    tab?: string;
}

export type OpenPageInspectorMessage = Message<OpenPageInspectorMessageData> & {
    type: 'OPEN_PAGE_INSPECTOR';
    senderId: number;
};

export type CollectPageTrailMessage = Message & {
    type: 'COLLECT_PAGE_TRAIL';
};

export type CollectPageTrailMessageResponseData = PageTrail;

export type CollectPageTrailMessageResponse = MessageResponse<CollectPageTrailMessageResponseData>;

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

export type OpenInspectorMessage = Message<OpenPageInspectorMessageData> & {
    type: 'OPEN_INSPECTOR';
};

export type SettingsUpdatedMessageData = ExtensionSettings;

export type SettingsUpdatedMessage = Message<SettingsUpdatedMessageData> & {
    type: 'SETTINGS_UPDATED';
};

// Type guards

export function isPopupInitializeMessage(message: Message): message is PopupInitializeMessage {
    return message.type === 'POPUP_INITIALISE';
}

export function isGetSettingsMessage(message: Message): message is GetSettingsMessage {
    return message.type === 'GET_SETTINGS';
}

export function isUpdateSettingsMessage(message: Message): message is UpdateSettingsMessage {
    return message.type === 'UPDATE_SETTINGS';
}

export function isAskQuestionMessage(message: Message): message is AskQuestionMessage {
    return message.type === 'ASK_QUESTION';
}

export function isGetPrevQuestionsMessage(message: Message): message is GetPrevQuestionsMessage {
    return message.type === 'GET_PREV_QUESTIONS';
}

export function isCollectPageTrailMessage(message: Message): message is CollectPageTrailMessage {
    return message.type === 'COLLECT_PAGE_TRAIL';
}

export function isStartOnboardingMessage(message: Message): message is StartOnboardingMessage {
    return message.type === 'START_ONBOARDING';
}

export function isClearPageMessage(message: Message): message is ClearPageMessage {
    return message.type === 'CLEAR_PAGE';
}

export function isOpenInspectorMessage(message: Message): message is OpenInspectorMessage {
    return message.type === 'OPEN_INSPECTOR';
}

export function isOpenPageInspectorMessage(message: Message): message is OpenPageInspectorMessage {
    return message.type === 'OPEN_PAGE_INSPECTOR';
}

export function isNavigateToElementMessage(message: Message): message is NavigateToElementMessage {
    return message.type === 'NAVIGATE_TO_ELEMENT';
}

export function isHighlightElementMessage(message: Message): message is HighlightElementMessage {
    return message.type === 'HIGHLIGHT_ELEMENT';
}

export function isSettingsUpdatedMessage(message: Message): message is SettingsUpdatedMessage {
    return message.type === 'SETTINGS_UPDATED';
}
