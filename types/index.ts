export enum MessageType {
    TEXT = 0,
    IMAGE = 1,
    VIDEO = 2,
    AUDIO = 3
}

export enum MessageState {
    SENDING = 0,
    SUCCESS = 1,
    FAILED = 2,
    RECALLED = 3
}

export enum MessageOptType {
    COPY = 0,
    DELETE = 1,
    RECALL = 2
}

export type TextMessage = {
    text: string
}

export type ImageMessage = {
    thumbnail: string,
    img: string,
}

export type VideoMessage = {
    thumbnail: string,
    video: string,
}

export type AudioMessage = {
    audio: string,
    duration: number
}

export type Message = {
    msgId: number,
    senderId: string,
    content: string | TextMessage | ImageMessage | VideoMessage | AudioMessage,
    uuid: number,
    type: MessageType,
    state: MessageState,
    roomId: string,
    isSender: boolean,
    quote: Message | null
    avatar?: string,
}

export type MessageOpt = {
    type: MessageOptType,
    uuid: number
}