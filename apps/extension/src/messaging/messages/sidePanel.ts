import type { Message, MessageResponse } from '../Message';

export interface RefreshPageInspectorMessageData {
    tab?: string;
}

export type RefreshPageInspectorMessage = Message<RefreshPageInspectorMessageData> & {
    type: 'REFRESH_PAGE_INSPECTOR';
};

export type SidePanelMessage = RefreshPageInspectorMessage;

export interface SidePanelMessageResponseMap {
    REFRESH_PAGE_INSPECTOR: undefined;
}

export type SidePanelMessageResponseData<M extends SidePanelMessage> = SidePanelMessageResponseMap[M['type']];
export type SidePanelMessageResponse<M extends SidePanelMessage> = MessageResponse<SidePanelMessageResponseData<M>>;

export function isRefreshPageInspectorMessage(message: Message): message is RefreshPageInspectorMessage {
    return message.type === 'REFRESH_PAGE_INSPECTOR';
}
