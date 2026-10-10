import type { AgentResultElement, QueryResponse } from '@flowforge/contract';

import type { Message, MessageResponse, PageScopedMessage } from '../Message';
import type { ExtensionSettings } from '@/core/types/settings';

export type PopupInitializeMessage = Message & {
    type: 'POPUP_INITIALISE';
};

export type GetSettingsMessage = Message & {
    type: 'GET_SETTINGS';
};

export interface UpdateSettingsMessageData {
    patch: Partial<ExtensionSettings>;
}

export type UpdateSettingsMessage = Message<UpdateSettingsMessageData> & {
    type: 'UPDATE_SETTINGS';
    pageId?: number;
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
    | PopupInitializeMessage
    | GetSettingsMessage
    | UpdateSettingsMessage
    | AskQuestionMessage
    | GetPrevQuestionsMessage
    | NavigateToElementMessage
    | OpenPageInspectorMessage;

export interface BackgroundMessageResponseMap {
    POPUP_INITIALISE: undefined;
    GET_SETTINGS: ExtensionSettings;
    UPDATE_SETTINGS: ExtensionSettings;
    ASK_QUESTION: QueryResponse;
    GET_PREV_QUESTIONS: PreviousQuestions;
    NAVIGATE_TO_ELEMENT: undefined;
    OPEN_PAGE_INSPECTOR: undefined;
}

export type BackgroundMessageResponseData<M extends BackgroundMessage> = BackgroundMessageResponseMap[M['type']];
export type BackgroundMessageResponse<M extends BackgroundMessage> = MessageResponse<BackgroundMessageResponseData<M>>;

function hasPageId(message: Message): message is PageScopedMessage {
    return 'pageId' in message && typeof message.pageId === 'number';
}

export function isPopupInitializeMessage(message: Message): message is PageScopedMessage<PopupInitializeMessage> {
    return message.type === 'POPUP_INITIALISE' && hasPageId(message);
}

export function isGetSettingsMessage(message: Message): message is GetSettingsMessage {
    return message.type === 'GET_SETTINGS';
}

export function isUpdateSettingsMessage(message: Message): message is UpdateSettingsMessage {
    return message.type === 'UPDATE_SETTINGS';
}

export function isAskQuestionMessage(message: Message): message is PageScopedMessage<AskQuestionMessage> {
    return message.type === 'ASK_QUESTION' && hasPageId(message);
}

export function isGetPrevQuestionsMessage(message: Message): message is PageScopedMessage<GetPrevQuestionsMessage> {
    return message.type === 'GET_PREV_QUESTIONS' && hasPageId(message);
}

export function isNavigateToElementMessage(message: Message): message is PageScopedMessage<NavigateToElementMessage> {
    return message.type === 'NAVIGATE_TO_ELEMENT' && hasPageId(message);
}

export function isOpenPageInspectorMessage(message: Message): message is PageScopedMessage<OpenPageInspectorMessage> {
    return message.type === 'OPEN_PAGE_INSPECTOR' && hasPageId(message);
}
