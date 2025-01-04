import { Message, MessageState } from "@/types";
import axios, { Axios } from 'axios';
import * as FileSystem from "expo-file-system"


let wsClient: WebSocket
let axiosCli: Axios | undefined
const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
export const connect = (roomId: string, onopen: () => void, onmessage: (_: string) => void, onclose: () => void) => {
  wsClient = new WebSocket(`${baseUrl}/chat-ws?${roomId}`);

  wsClient.onopen = () => {
    console.log("WebSocket connected");
    // refreshMembers()
    onopen()
  };

  wsClient.onclose = (e) => {
    console.log(`WebSocket disconnected, code: ${e.code}`);
    if (e.code === 3401) {
      onclose()
    } else {
      setTimeout(() => {
        connect(roomId, onopen, onmessage, onclose)
      }, 1000);
    }
  };

  wsClient.onmessage = (e) => {
    onmessage(e.data)
  };
}

export function sendMessage(message: Message, roomId: string, onSuccess: (uuid: number) => void, on401: () => void, onerror: () => void) {
  getAxiosCli().post("/api/chat/send", {
    messageId: message.msgId,
    type: message.type,
    data: JSON.stringify(message.content),
  }, {
    headers: {
      "RoomId": encodeURIComponent(roomId)
    }
  }).then(res => {
    console.log(`response status: ${res.status}`)
    if (res.status === 401) {
      on401()
      return
    }
    onSuccess(res.data.uuid)
  }).catch(e => {
    onerror()
  })
}

export function pullMessage(
  roomId: string,
  uuid: number,
  direction: "before" | "after",
  onSuccess: (msgs: Message[]) => void,
  on401: () => void,
  onerror: () => void
) {
  axios.post("/api/chat/pull", {
    uuid: uuid,
    direction: direction
  }, {
    headers: {
      "RoomId": roomId
    }
  }).then(res => {
    if (res.status === 401) {
      on401()
      return
    }
    const receivedMessages: {
      message: {
        messageId: number,
        type: number,
        data: string,
        sender: string
      },
      send: boolean,
      success: boolean,
      uuid: number
    }[] = res.data
    onSuccess(receivedMessages.map(m => ({
      msgId: res.data.message.messageId,
      senderId: res.data.message.sender,
      content: JSON.parse(res.data.message.data),
      uuid: res.data.uuid,
      type: res.data.message.type,
      state: MessageState.SUCCESS,
      roomId: roomId,
      isSender: false,
    })))
  }).catch(e => {
    onerror()
  })
}

export async function downloadFile(url: string, roomId: string): Promise<string> {
  const fileUrl = FileSystem.cacheDirectory + `/${roomId}/${Date.now().toString()}_thumbnial.png`
  return FileSystem.downloadAsync(url, fileUrl)
  .then(() => fileUrl)
  .catch(e => {
    throw new Error("下载失败")
  })
}


export function login(roomId: string, username: string, optToken: string, onSuccess: () => void, onerror: () => void) {
  getAxiosCli().post("/api/login", {
    username: username,
    roomId: roomId,
    token: optToken
  }).then(res => {
    if (res.status !== 200) {
      console.log("response status: ", res.status)
      onerror()
    } else {
      onSuccess()
    }
  }).catch(e => {
    console.log("error: ", e.message)
    onerror()
  })
}


function getAxiosCli() {
  if (!axiosCli) {
    console.log(`API_URL: ${baseUrl}`)
    axiosCli = axios.create({
      baseURL: baseUrl,
    })
  }
  return axiosCli
}

export async function uploadFile(uri: string, uploadProgress?: (progress: number) => void): Promise<string> {
  const uploadTask = FileSystem.createUploadTask('https://fars.ee', uri, {
    fieldName: 'file',
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    }
  }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
    const progress = parseFloat((totalBytesSent / (totalBytesExpectedToSend || 1)).toFixed(2));
    uploadProgress?.(progress)
  });

  return uploadTask.uploadAsync().then(res => {
    console.log('result body: ', res?.body)
    return JSON.parse(res!.body).url
  }).catch(e => {
    console.log('upload error: ', e)
    throw new Error("上传失败")
  })
}