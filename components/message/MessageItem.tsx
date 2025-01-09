import { AudioMessage, ImageMessage, Message, MessageState, MessageType, TextMessage, VideoMessage } from "@/types"
import { HStack } from "../ui/hstack"
import { Center } from "../ui/center"
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import React, { useEffect } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import AudioAnimatedIcon from "./AudioAnimatedIcon";
import { Audio } from 'expo-av';
import { Sound } from "expo-av/build/Audio";
import { RotateCcw } from "lucide-react-native";

type MessageItemProps = {
    msg: Message,
    retry: (_: Message) => void,
}
export default function MessageItem({ msg, retry }: MessageItemProps) {

  // const [state, setState] = React.useState<MessageState>()

  useEffect(() => {
    console.log(`msg ${JSON.stringify(msg.content)} state is ${msg.state}`)
   }, [])

  const onRetry = () => {
    console.log("retry")
    retry(msg)
    // setState(MessageState.SENDING)
  }
  return !msg.isSender ?
    <HStack space='md' style={[{ alignItems: 'center' }, styles.container]}>
      <Image
        source={{ uri: msg.avatar }}
        style={{ width: 36, height: 36, borderRadius: 6 }}
      />
      <Center style={{
        backgroundColor: 'white',
        maxWidth: '60%',
        padding: 10,
        borderRadius: 10
      }}>
        <MessageUnit msg={msg} style={{ alignSelf: 'flex-start' }} direction="left"/>
      </Center>
    </HStack> :
    <HStack space='md' style={[{ alignItems: 'center', alignSelf: 'flex-end' }, styles.container]}>
      {msg.state === MessageState.SENDING && <ActivityIndicator /> }
      {msg.state === MessageState.FAILED &&
        <Pressable onPress={onRetry}>
          <RotateCcw color='black' />
        </Pressable>
      }
      <Center style={{
        backgroundColor: 'white',
        maxWidth: '60%',
        padding: 10,
        borderRadius: 10
      }}>
        <MessageUnit msg={msg} style={{ alignSelf: 'flex-end' }} direction="right"/>
      </Center>
      <Image
        source={{ uri: msg.avatar }}
        style={{ width: 36, height: 36, borderRadius: 6 }}
      />
    </HStack>
}

type MessageUnitProps = {
  style?: any,
  msg: Message,
  direction?: 'left' | 'right',
}
function MessageUnit({msg, style, direction }: MessageUnitProps) {

  const [playing, setPlaying] = React.useState(false)
  const playingRef = React.useRef<NodeJS.Timeout | null>(null)
  const sound = React.useRef<Sound>()
  const breakImage = require('../../assets/images/break.png')
  const imgSrc: string = (msg.content as ImageMessage).thumbnail ? (msg.content as ImageMessage).thumbnail : breakImage
  console.log("imgSrc: ", imgSrc)

  
  const goToImageViewer = async (msg: Message) => {
    const roomId = msg.roomId
    const uuid = msg.uuid
    if ((msg.content as ImageMessage).img) {
      router.push({
        pathname: '/imageviewer',
        params: { roomId, uuid },
      })
    }
  }

  const playAudio = async () => {
    if (playingRef.current) {
      clearTimeout(playingRef.current)
    }
    if (playing) {
      setPlaying(false)
      await sound.current?.unloadAsync()
      sound.current = undefined
    } else {
      setPlaying(true)
      sound.current  = (await Audio.Sound.createAsync({ uri: (msg.content as AudioMessage).audio })).sound
      sound.current.playAsync()
      playingRef.current = setTimeout(() => {
        setPlaying(false)
      }, (msg.content as AudioMessage).duration)
    }
  }

  switch (msg.type) {
    case MessageType.TEXT:
      return <Text style={style}>{(msg.content as TextMessage).text}</Text>
    case MessageType.IMAGE:
      return (
        <Pressable style={style} onPress={() => goToImageViewer(msg)}>
          <Image
            style={styles.thumbnial}
            source={imgSrc}
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
        <Pressable onPress={playAudio}>
          <View style={[styles.audioContainer, { justifyContent: direction === 'right' ? 'flex-end' : 'flex-start'}]}>
            <Text style={{ marginHorizontal: 10 }}>{Math.round((msg.content as AudioMessage).duration / 1000)}s</Text>
            <AudioAnimatedIcon size={24} playing={playing} rotate={direction === 'right' ? 180 : 0} />
          </View>
        </Pressable>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
})
