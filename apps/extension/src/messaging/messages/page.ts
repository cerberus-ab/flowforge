import type { AgentResultElement, AgentResultMode, PageTrailDto } from '@flowforge/contract';
import type { Message, MessageResponse } from '../Message';
import type { ExtensionSettings } from '@/core/types/settings';

export interface StartOnboardingMessageData {
    title: string;
    description: string;
    mode: AgentResultMode;
    elements: AgentResultElement[];
}

export type CollectPageTrailMessage = Message & {
    type: 'COLLECT_PAGE_TRAIL';
};

export interface ContainsElementsMessageData {
    dataIds: string[];
}

export type ContainsElementsMessage = Message<ContainsElementsMessageData> & {
    type: 'CONTAINS_ELEMENTS';
};

export type ClearPageMessage = Message & {
    type: 'CLEAR_PAGE';
};

export type StartOnboardingMessage = Message<StartOnboardingMessageData> & {
    type: 'START_ONBOARDING';
};

export interface HighlightElementMessageData {
    element: AgentResultElement;
}

export type HighlightElementMessage = Message<HighlightElementMessageData> & {
    type: 'HIGHLIGHT_ELEMENT';
};

export interface OpenInspectorMessageData {
    tab?: string;
}

export type OpenInspectorMessage = Message<OpenInspectorMessageData> & {
    type: 'OPEN_INSPECTOR';
};

export type SettingsUpdatedMessageData = ExtensionSettings;

export type SettingsUpdatedMessage = Message<SettingsUpdatedMessageData> & {
    type: 'SETTINGS_UPDATED';
};

export type PageMessage =
    | CollectPageTrailMessage
    | ContainsElementsMessage
    | ClearPageMessage
    | StartOnboardingMessage
    | HighlightElementMessage
    | OpenInspectorMessage
    | SettingsUpdatedMessage;

export interface PageMessageResponseMap {
    COLLECT_PAGE_TRAIL: PageTrailDto;
    CONTAINS_ELEMENTS: boolean;
    CLEAR_PAGE: undefined;
    START_ONBOARDING: undefined;
    HIGHLIGHT_ELEMENT: undefined;
    OPEN_INSPECTOR: undefined;
    SETTINGS_UPDATED: undefined;
}

export type PageMessageResponseData<M extends PageMessage> = PageMessageResponseMap[M['type']];
export type PageMessageResponse<M extends PageMessage> = MessageResponse<PageMessageResponseData<M>>;

export function isCollectPageTrailMessage(message: Message): message is CollectPageTrailMessage {
    return message.type === 'COLLECT_PAGE_TRAIL';
}

export function isContainsElementsMessage(message: Message): message is ContainsElementsMessage {
    return message.type === 'CONTAINS_ELEMENTS';
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

export function isHighlightElementMessage(message: Message): message is HighlightElementMessage {
    return message.type === 'HIGHLIGHT_ELEMENT';
}

export function isSettingsUpdatedMessage(message: Message): message is SettingsUpdatedMessage {
    return message.type === 'SETTINGS_UPDATED';
}
