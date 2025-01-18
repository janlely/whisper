import { AudioMessage, ImageMessage, Message, MessageState, MessageType, TextMessage, VideoMessage } from "@/types"
import { HStack } from "../ui/hstack"
import { Center } from "../ui/center"
// import { Text } from "../ui/text"
import { Pressable, StyleSheet, View, ActivityIndicator, Modal, Dimensions, TouchableOpacity, Text } from 'react-native';
import React from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import AudioAnimatedIcon from "./AudioAnimatedIcon";
import { Audio } from 'expo-av';
import { Sound } from "expo-av/build/Audio";
import Svg, { G, Path, Rect } from 'react-native-svg';
import { getEventEmitter } from '@/utils'

type MessageItemProps = {
    msg: Message,
    retry: (_: Message) => void,
}
const SCREEN_WIDTH = Dimensions.get('window').width;
export default function MessageItem({ msg, retry }: MessageItemProps) {

  const [popupTop, setPopupTop] = React.useState(0);
  const [popupLeft, setPopupLeft] = React.useState(0);
  const [popupRight, setPopupRight] = React.useState(0);
  const pressableRef = React.useRef<View>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  const onRetry = () => {
    console.log("retry")
    retry(msg)
  }

  const handleLongPress = () => {
    if (pressableRef.current) {
      pressableRef.current.measure((x, y, width, height, px, py) => {
        // console.log(`组件相对于屏幕左上角的绝对位置: (${px}, ${py})`)
        setPopupLeft(px)
        setPopupTop(py -15 + height)
        setPopupRight(SCREEN_WIDTH - px - width)
        setModalVisible(true);
      })
    }
  };
  const recallMessageElement = (
    <Center>
      <Text style={{ backgroundColor: 'gray', fontSize: 12 }}>{msg.isSender ? "你" : msg.senderId }撤回了一条消息</Text>
    </Center>
  )

  const normalMessage = (msg: Message) => (
    !msg.isSender ?
      <HStack space='md' style={[{ alignItems: 'flex-start' }, styles.container]}>
        <Image
          source={{ uri: msg.avatar }}
          style={{ width: 36, height: 36, borderRadius: 6 }}
        />
        <Center style={{
          // backgroundColor: 'white',
          maxWidth: '60%',
          padding: 5,
          // borderRadius: 10
        }}>
          <Pressable
            onLongPress={handleLongPress}
            ref={pressableRef}
            style={{backgroundColor: 'white', padding: 5, borderRadius: 3, alignSelf: 'flex-start'}}
          >
            <MessageUnit msg={msg} style={{ alignSelf: 'flex-start' }} direction="left" />
          </Pressable>
          {msg.quote &&
            <Text style={styles.quote}>{msg.quote.senderId}: {(msg.quote!.content as TextMessage).text}</Text>
          }
          <Modal transparent visible={modalVisible}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              <View style={[styles.popup, { top: popupTop, left: popupLeft }]}>
                <View style={styles.leftArrow} />
                <View className="flex-row">
                  <CopyOperator
                    operate={() => {
                      getEventEmitter().emit('messageOperation', { type: 'copy', msg: msg })
                      setModalVisible(false)
                    }}
                  />
                  <DeleteOperator operate={() => { getEventEmitter().emit('messageOperation', { type: 'delete', msg: msg }) }} />
                  {msg.type === MessageType.TEXT &&
                    <QuoteOperator operate={() => {
                      getEventEmitter().emit('messageOperation', { type: 'quote', msg: msg })
                      setModalVisible(false)
                    }} />
                  }
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </Center>
      </HStack> :
      <HStack space='md' style={[{ alignItems: 'flex-start', alignSelf: 'flex-end' }, styles.container]}>
        {msg.state === MessageState.SENDING && <ActivityIndicator />}
        {msg.state === MessageState.FAILED &&
          <Pressable onPress={onRetry} style={{ alignSelf: 'center' }}>
            <Svg viewBox="0 0 24 24"  width={20} height={20}>
              <G id="SVGRepo_bgCarrier" stroke-width="0"/>
              <G id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
              <G id="SVGRepo_iconCarrier">
                <Path d="M12 21C10.22 21 8.47991 20.4722 6.99987 19.4832C5.51983 18.4943 4.36628 17.0887 3.68509 15.4442C3.0039 13.7996 2.82567 11.99 3.17294 10.2442C3.5202 8.49836 4.37737 6.89472 5.63604 5.63604C6.89472 4.37737 8.49836 3.5202 10.2442 3.17294C11.99 2.82567 13.7996 3.0039 15.4442 3.68509C17.0887 4.36628 18.4943 5.51983 19.4832 6.99987C20.4722 8.47991 21 10.22 21 12C21 14.387 20.0518 16.6761 18.364 18.364C16.6761 20.0518 14.387 21 12 21ZM12 4.5C10.5166 4.5 9.0666 4.93987 7.83323 5.76398C6.59986 6.58809 5.63856 7.75943 5.07091 9.12988C4.50325 10.5003 4.35473 12.0083 4.64411 13.4632C4.9335 14.918 5.64781 16.2544 6.6967 17.3033C7.7456 18.3522 9.08197 19.0665 10.5368 19.3559C11.9917 19.6453 13.4997 19.4968 14.8701 18.9291C16.2406 18.3614 17.4119 17.4001 18.236 16.1668C19.0601 14.9334 19.5 13.4834 19.5 12C19.5 10.0109 18.7098 8.10323 17.3033 6.6967C15.8968 5.29018 13.9891 4.5 12 4.5Z" fill="red"/>
                <Path d="M12 13C11.8019 12.9974 11.6126 12.9176 11.4725 12.7775C11.3324 12.6374 11.2526 12.4481 11.25 12.25V8.75C11.25 8.55109 11.329 8.36032 11.4697 8.21967C11.6103 8.07902 11.8011 8 12 8C12.1989 8 12.3897 8.07902 12.5303 8.21967C12.671 8.36032 12.75 8.55109 12.75 8.75V12.25C12.7474 12.4481 12.6676 12.6374 12.5275 12.7775C12.3874 12.9176 12.1981 12.9974 12 13Z" fill="red"/>
                <Path d="M12 16C11.8019 15.9974 11.6126 15.9176 11.4725 15.7775C11.3324 15.6374 11.2526 15.4481 11.25 15.25V14.75C11.25 14.5511 11.329 14.3603 11.4697 14.2197C11.6103 14.079 11.8011 14 12 14C12.1989 14 12.3897 14.079 12.5303 14.2197C12.671 14.3603 12.75 14.5511 12.75 14.75V15.25C12.7474 15.4481 12.6676 15.6374 12.5275 15.7775C12.3874 15.9176 12.1981 15.9974 12 16Z" fill="red"/>
              </G>
            </Svg>
          </Pressable>
        }
        <Center style={{
          // backgroundColor: 'white',
          maxWidth: '60%',
          padding: 5,
          // padding: 10,
          // borderRadius: 10
        }}>
          <Pressable
            onLongPress={handleLongPress}
            ref={pressableRef}
            style={{backgroundColor: 'white', padding: 5, borderRadius: 3, alignSelf: 'flex-end'}}
          >
            <MessageUnit msg={msg} style={{ alignSelf: 'flex-end' }} direction="right" />
          </Pressable>
          {msg.quote &&
            <Text style={styles.quote}>{msg.quote.senderId}: {(msg.quote!.content as TextMessage).text}</Text>
          }
          <Modal transparent visible={modalVisible}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              <View style={[styles.popup, { top: popupTop, right: popupRight }]}>
                <View style={styles.rightArrow} />
                <View className="flex-row">
                  <CopyOperator
                    operate={() => {
                      getEventEmitter().emit('messageOperation', { type: 'copy', msg: msg })
                      setModalVisible(false)
                    }}
                  />
                  <RecallOperator operate={() => { getEventEmitter().emit('messageOperation', { type: 'recall', msg: msg }) }} />
                  <DeleteOperator operate={() => { getEventEmitter().emit('messageOperation', { type: 'delete', msg: msg }) }} />
                  {msg.type === MessageType.TEXT &&
                    <QuoteOperator operate={() => {
                      getEventEmitter().emit('messageOperation', { type: 'quote', msg: msg })
                      setModalVisible(false)
                    }} />
                  }
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </Center>
        <Image
          source={{ uri: msg.avatar }}
          style={{ width: 36, height: 36, borderRadius: 6 }}
        />
      </HStack>
  )

  return msg.state === MessageState.RECALLED ? recallMessageElement : normalMessage(msg)
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

type OperatorProps = {
  operate: () => void
}
function RecallOperator({operate}: OperatorProps) {
  return (
    <Pressable onPress={operate}>
      <View style={styles.operator}>
        <Svg width={"24"} height={"28"} viewBox="0 0 1024 1024" >
          <G id="SVGRepo_bgCarrier" stroke-width="0"/>
          <G id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
          <G id="SVGRepo_iconCarrier">
            <Path d="M776.577087 687.485754h-142.616987l35.111076-26.332283c9.69517-7.263442 11.655911-21.019342 4.381205-30.714512-7.253204-9.652167-20.986578-11.655911-30.714512-4.381205l-111.159134 83.368838 111.159134 83.368839a21.822068 21.822068 0 0 0 13.14464 4.392468c6.674708 0 13.262387-3.031724 17.569872-8.773673 7.273681-9.69517 5.313965-23.451069-4.381205-30.714512l-35.111076-26.332283h142.616987c42.337658 0 76.791399 34.453741 76.7914 76.791399s-34.453741 76.791399-76.7914 76.7914H590.083543c-12.116659 0-21.940839 9.82418-21.940839 21.940838s9.82418 21.940839 21.940839 21.940839h186.493544c66.539236 0 120.672053-54.132817 120.672053-120.672053s-54.132817-120.674101-120.672053-120.6741z" fill="#c9cdd4"/>
            <Path d="M173.2158 863.008367V160.915865c0-12.095157 9.845681-21.940839 21.940838-21.940838h570.450542c12.095157 0 21.940839 9.845681 21.940839 21.940838v416.867743H831.428672V160.915865c0-36.295711-29.525781-65.821492-65.821492-65.821492H195.156638c-36.295711 0-65.821492 29.524757-65.821492 65.821492v702.092502c0 36.295711 29.524757 65.821492 65.821492 65.821492h263.284945v-43.880653H195.156638c-12.095157 0-21.940839-9.845681-21.940838-21.940839z" fill="#c9cdd4"/>
            <Path d="M239.037292 270.618011h285.224759v43.880653H239.037292zM655.905035 248.677172h87.761306v87.761307h-87.761306zM239.037292 490.022302h504.629049v43.880653H239.037292zM239.037292 709.425568h241.344105V753.306222H239.037292z" fill="#c9cdd4"/>
          </G>
        </Svg>
        <Text style={{ fontSize: 10, textAlign: 'center' }}>撤回</Text>
      </View>
    </Pressable>
  )
}

function CopyOperator({operate}: OperatorProps) {
  return (
    <Pressable onPress={() => {
      console.log('copy pressed')
      operate()
    }}>
      <View style={styles.operator}>
        <Svg width="24" height="28" viewBox="0 0 60 70">
          <Rect x="15" y="5" width="40" height="40" fill="#c9cdd4" rx={5} ry={5} />
          <Rect x="5" y="20" width="40" height="40" fill="lightgray" rx={5} ry={5} />
        </Svg>
        <Text style={{ fontSize: 10, textAlign: 'center' }}>复制</Text>
      </View>
    </Pressable>
  )
}

function QuoteOperator({operate}: OperatorProps) {
  return (
    <Pressable onPress={() => {
      console.log('quote pressed')
      operate()
    }}>
      <View style={styles.operator}>
        <Svg viewBox="0 0 24 24" width="24" height="28" fill="none">
          <G id="SVGRepo_bgCarrier" stroke-width="0"/>
          <G id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
          <G id="SVGRepo_iconCarrier">
            <Path opacity="0.4" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#292D32"/>
            <Path d="M8.19 16.78H9.67999C10.77 16.78 11.62 15.93 11.62 14.84V13.35C11.62 12.26 10.77 11.41 9.67999 11.41H7.77C7.85 9.59997 8.27 9.33 9.48 8.62C9.84 8.41 9.95001 7.95003 9.74001 7.59003C9.60001 7.35003 9.35 7.21997 9.09 7.21997C8.96 7.21997 8.83001 7.25001 8.71001 7.32001C6.92001 8.38001 6.25 9.07002 6.25 12.15V14.82C6.25 15.91 7.12 16.78 8.19 16.78Z" fill="#292D32"/>
            <Path d="M14.3209 16.78H15.8109C16.9009 16.78 17.7509 15.93 17.7509 14.84V13.35C17.7509 12.26 16.9009 11.41 15.8109 11.41H13.9008C13.9808 9.59997 14.4009 9.33 15.6109 8.62C15.9709 8.41 16.0808 7.95003 15.8708 7.59003C15.7308 7.35003 15.4809 7.21997 15.2209 7.21997C15.0909 7.21997 14.9609 7.25001 14.8409 7.32001C13.0509 8.38001 12.3809 9.07002 12.3809 12.15V14.82C12.3909 15.91 13.2609 16.78 14.3209 16.78Z" fill="#292D32"/>
          </G>
        </Svg>
        <Text style={{ fontSize: 10, textAlign: 'center' }}>引用</Text>
      </View>
    </Pressable>
  )
}

function DeleteOperator({operate}: OperatorProps) {
  return (
    <Pressable onPress={operate}>
      <View style={styles.operator}>
        <Svg width="24" height="28" viewBox="0 0 24 24" >
          <G id="SVGRepo_bgCarrier" stroke-width="0"/>
          <G id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.624"/>
          <G id="SVGRepo_iconCarrier">
            <Path d="M10 12V17" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <Path d="M14 12V17" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <Path d="M4 7H20" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <Path d="M6 10V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <Path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </G>
        </Svg>
        <Text style={{ fontSize: 10, textAlign: 'center' }}>删除</Text>
      </View>
    </Pressable>
  )
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
  },
  popup: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: 'gray',
    borderRadius: 6,
    position: 'absolute',
    height: 55 
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightArrow: {
    position: 'absolute',
    width: 10,
    height: 10,
    right: 10,
    top: -5,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'gray',
  },
  leftArrow: {
    position: 'absolute',
    width: 10,
    height: 10,
    left: 10,
    top: -5,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'gray',
  },
  operator: {
    padding: 2,
    marginHorizontal: 10
  },
  quote: {
    marginTop: 5,
    backgroundColor: '#d9dbda',
    borderRadius: 2
  }
})
