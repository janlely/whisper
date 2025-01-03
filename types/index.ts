export enum MessageType {
    TEXT = 0,
    IMAGE = 1,
    VIDEO = 2,
    AUDIO = 3
}

export enum MessageState {
    SENDING = 0,
    SUCCESS = 1,
    FAILED = 2
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
    audio: string
}

export type Message = {
    msgId: string,
    senderId: string,
    content: TextMessage | ImageMessage | VideoMessage | AudioMessage,
    uuid: string,
    type: MessageType,
    state: MessageState,
    roomId: string,
    isSender: boolean,
}
