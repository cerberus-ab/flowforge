import type { AgentResult, AgentResultElement } from '@flowforge/contract';

import type { Message, MessageResponse } from '../Message';
import type { ExtensionSettings } from '@/core/types/settings';
import type { QuerySessionDataPending, QuerySessionDataCompleted } from '@/core/services/QuerySessionStorage';

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

export type RestoreQueryMessage = Message & {
    type: 'RESTORE_QUERY';
};

export type RestoreQueryResponse =
    | { status: 'empty' }
    | { status: 'pending'; queryId: string; data: QuerySessionDataPending }
    | { status: 'completed'; queryId: string; data: QuerySessionDataCompleted }
    | { status: 'stale'; queryId: string; data: QuerySessionDataCompleted };

export interface AskQuestionMessageData {
    question: string;
}

export type AskQuestionMessage = Message<AskQuestionMessageData> & {
    type: 'ASK_QUESTION';
};

export interface AskQuestionResponse {
    queryId: string;
}

export type GetPrevQuestionsMessage = Message & {
    type: 'GET_PREV_QUESTIONS';
};

export interface PreviousQuestionsResponse {
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

export interface OpenOnboardingMessageData {
    question: string;
    result: AgentResult;
}

export type OpenOnboardingMessage = Message<OpenOnboardingMessageData> & {
    type: 'OPEN_ONBOARDING';
};

export type BackgroundMessage =
    | PopupOpenedMessage
    | GetSettingsMessage
    | UpdateSettingsMessage
    | RestoreQueryMessage
    | AskQuestionMessage
    | GetPrevQuestionsMessage
    | NavigateToElementMessage
    | OpenPageInspectorMessage
    | OpenOnboardingMessage;

export interface BackgroundMessageResponseMap {
    POPUP_OPENED: undefined;
    GET_SETTINGS: ExtensionSettings;
    UPDATE_SETTINGS: ExtensionSettings;
    RESTORE_QUERY: RestoreQueryResponse;
    ASK_QUESTION: AskQuestionResponse;
    GET_PREV_QUESTIONS: PreviousQuestionsResponse;
    NAVIGATE_TO_ELEMENT: undefined;
    OPEN_PAGE_INSPECTOR: undefined;
    OPEN_ONBOARDING: undefined;
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

export function isRestoreQueryMessage(message: Message): message is RestoreQueryMessage {
    return message.type === 'RESTORE_QUERY';
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

export function isOpenOnboardingMessage(message: Message): message is OpenOnboardingMessage {
    return message.type === 'OPEN_ONBOARDING';
}
