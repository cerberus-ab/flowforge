import type { Message, MessageResponse } from '../Message';

export interface QueryFinishedMessageData {
    queryId: string;
}

export type QueryFinishedMessage = Message<QueryFinishedMessageData> & {
    type: 'QUERY_FINISHED';
};

export type PopupMessage = QueryFinishedMessage;

export interface PopupMessageResponseMap {
    QUERY_FINISHED: undefined;
}

export type PopupMessageResponseData<M extends PopupMessage> = PopupMessageResponseMap[M['type']];
export type PopupMessageResponse<M extends PopupMessage> = MessageResponse<PopupMessageResponseData<M>>;

export function isQueryFinishedMessage(message: Message): message is QueryFinishedMessage {
    return message.type === 'QUERY_FINISHED';
}
