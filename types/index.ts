export enum MessageType {
    TEXT = 0,
    IMAGE = 1,
    VIDEO = 2
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

export type Message = {
    msgId: string,
    senderId: string,
    content: TextMessage | ImageMessage | VideoMessage,
    uuid: string,
    type: MessageType
}

export type MessageData = {
    msg: Message,
    success: boolean,
    failed: boolean,
    isSender: boolean
}