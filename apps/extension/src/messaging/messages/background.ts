import type { AgentResultElement, QueryResponse } from '@flowforge/contract';

import type { Message, MessageResponse } from '../Message';
import type { ExtensionSettings } from '@/core/types/settings';

export type PopupOpenedMessage = Message & {
    type: 'POPUP_OPENED';
};

export type GetSettingsMessage = Message & {
    type: 'GET_SETTINGS';
};

export interface UpdateSettingsMessageData {
    patch: Partial<ExtensionSettings>;
}

export type UpdateSettingsMessage = Message<UpdateSettingsMessageData> & {
    type: 'UPDATE_SETTINGS';
};

export interface AskQuestionMessageData {
    question: string;
}

export type AskQuestionMessage = Message<AskQuestionMessageData> & {
    type: 'ASK_QUESTION';
};

export type GetPrevQuestionsMessage = Message & {
    type: 'GET_PREV_QUESTIONS';
};

export interface PreviousQuestions {
    questions: string[];
}

export interface NavigateToElementMessageData {
    element: AgentResultElement;
}

export type NavigateToElementMessage = Message<NavigateToElementMessageData> & {
    type: 'NAVIGATE_TO_ELEMENT';
};

export interface OpenPageInspectorMessageData {
    tab?: string;
}

export type OpenPageInspectorMessage = Message<OpenPageInspectorMessageData> & {
    type: 'OPEN_PAGE_INSPECTOR';
};

export type BackgroundMessage =
    | PopupOpenedMessage
    | GetSettingsMessage
    | UpdateSettingsMessage
    | AskQuestionMessage
    | GetPrevQuestionsMessage
    | NavigateToElementMessage
    | OpenPageInspectorMessage;

export interface BackgroundMessageResponseMap {
    POPUP_OPENED: undefined;
    GET_SETTINGS: ExtensionSettings;
    UPDATE_SETTINGS: ExtensionSettings;
    ASK_QUESTION: QueryResponse;
    GET_PREV_QUESTIONS: PreviousQuestions;
    NAVIGATE_TO_ELEMENT: undefined;
    OPEN_PAGE_INSPECTOR: undefined;
}

export type BackgroundMessageResponseData<M extends BackgroundMessage> = BackgroundMessageResponseMap[M['type']];
export type BackgroundMessageResponse<M extends BackgroundMessage> = MessageResponse<BackgroundMessageResponseData<M>>;

export function isPopupOpenedMessage(message: Message): message is PopupOpenedMessage {
    return message.type === 'POPUP_OPENED';
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

export function isNavigateToElementMessage(message: Message): message is NavigateToElementMessage {
    return message.type === 'NAVIGATE_TO_ELEMENT';
}

export function isOpenPageInspectorMessage(message: Message): message is OpenPageInspectorMessage {
    return message.type === 'OPEN_PAGE_INSPECTOR';
}
