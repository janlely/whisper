import { ImageMessage, Message, MessageData, MessageType, TextMessage, VideoMessage } from "@/types"
import { HStack } from "../ui/hstack"
import { Avatar } from "@rneui/base"
import { Center } from "../ui/center"
import { Text } from 'react-native';
import { Image } from "../ui/image";
import React from "react";
import { Modal } from "../ui/modal";
import Video from 'react-native-video';

type MessageItemProps = {
    msg: MessageData
}
export default function MessageItem({ msg }: MessageItemProps) {
  return msg.isSender ?
    <HStack space='md' style={{ alignItems: 'center' }}>
      <Avatar
        rounded={false}
        title={msg.msg.senderId.substring(0, 3)}
        size={40}
        containerStyle={{ backgroundColor: 'lightgreen', borderRadius: 10 }}
      />
      <Center style={{
        backgroundColor: 'white',
        width: '60%',
        padding: 10,
        borderRadius: 10
      }}>
        {/* <Text style={{ alignSelf: 'flex-start' }}>{msg.msg.content.text}</Text> */}
        <MessageUnit msg={msg.msg} style={{ alignSelf: 'flex-start' }}/>
      </Center>
    </HStack> :
    <HStack space='md' style={{ alignItems: 'center', alignSelf: 'flex-end' }}>
      <Center style={{
        backgroundColor: 'white',
        width: '60%',
        padding: 10,
        borderRadius: 10
      }}>
        {/* <Text style={{ alignSelf: 'flex-end' }}>{msg.msg.content}</Text> */}
        <MessageUnit msg={msg.msg} style={{ alignSelf: 'flex-end' }}/>
      </Center>
      <Avatar
        rounded={false}
        title={msg.msg.senderId.substring(0, 3)}
        size={40}
        containerStyle={{ backgroundColor: 'lightgreen', borderRadius: 10 }}
      />
    </HStack>
}

type MessageUnitProps = {
  style?: any,
  msg: Message
}
function MessageUnit({msg, style}: MessageUnitProps) {
  const [popup, setPopup] = React.useState(false)

  switch (msg.type) {
    case MessageType.TEXT:
      return <Text style={style}>{(msg.content as TextMessage).text}</Text>
    case MessageType.IMAGE:
      return (popup ?
        <Modal>
          <Image source={{ uri: (msg.content as ImageMessage).img}} />
        </Modal> :
        <Image style={style} source={{ uri: (msg.content as ImageMessage).thumbnail}} />
      )
    case MessageType.VIDEO:
      return (popup ?
        <Modal>
          <Video
            source={{ uri: (msg.content as VideoMessage).video }}
          />
        </Modal> :
        <Image style={style} source={{ uri: (msg.content as VideoMessage).thumbnail}} />
      )
  }
}