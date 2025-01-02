import { ImageMessage, Message, MessageType, TextMessage, VideoMessage } from "@/types"
import { HStack } from "../ui/hstack"
import { Avatar } from "@rneui/base"
import { Center } from "../ui/center"
import { Pressable, Text, StyleSheet, View } from 'react-native';
import React from "react";
import Animated from "react-native-reanimated";
import { router } from "expo-router";
import { Image } from "expo-image";

type MessageItemProps = {
    msg: Message
}
export default function MessageItem({ msg }: MessageItemProps) {

  return !msg.isSender ?
    <HStack space='md' style={[{ alignItems: 'center' }, styles.container]}>
      <Avatar
        rounded={false}
        title={msg.senderId.substring(0, 3)}
        size={40}
        containerStyle={{ backgroundColor: 'lightgreen', borderRadius: 10 }}
      />
      <Center style={{
        backgroundColor: 'white',
        // width: '60%',
        maxWidth: '60%',
        padding: 10,
        borderRadius: 10
      }}>
        <MessageUnit msg={msg} style={{ alignSelf: 'flex-start' }}/>
      </Center>
    </HStack> :
    <HStack space='md' style={[{ alignItems: 'center', alignSelf: 'flex-end' }, styles.container]}>
      <Center style={{
        backgroundColor: 'white',
        // width: '60%',
        maxWidth: '60%',
        padding: 10,
        borderRadius: 10
      }}>
        <MessageUnit msg={msg} style={{ alignSelf: 'flex-end' }}/>
      </Center>
      <Avatar
        rounded={false}
        title={msg.senderId.substring(0, 3)}
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
  
  const goToImageViewer = (roomId: string, uuid: string) => {
    console.log("roomId: ", roomId)
    console.log("uuid: ", uuid)
    router.push({
      pathname: '/imageviewer',
      params: { roomId, uuid },
    })
  }

  switch (msg.type) {
    case MessageType.TEXT:
      return <Text style={style}>{(msg.content as TextMessage).text}</Text>
    case MessageType.IMAGE:
      return (
        <Pressable style={style} onPress={() => goToImageViewer(msg.roomId, msg.uuid)}>
          <Image
            style={styles.thumbnial}
            source={{ uri: (msg.content as ImageMessage).thumbnail }}
            contentFit="contain"
          />
        </Pressable>
      )
    case MessageType.VIDEO:
      return (
        <Image style={style} source={{ uri: (msg.content as VideoMessage).thumbnail}} />
      )
    case MessageType.AUDIO:
      return (
        <View style={styles.audioContainer}>
        </View>
      )
  }
}

const styles = StyleSheet.create({
  thumbnial: {
    width: 100,
    height: 100
  },
  container: {
    marginVertical: 10
  },
  audioContainer: {
    width: 100,
    height: 30,
    backgroundColor: 'white',
    borderRadius: 10
  }
})
