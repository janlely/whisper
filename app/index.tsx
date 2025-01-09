import { Pressable, StyleSheet } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Smile, AudioLines, KeyboardIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Message, MessageType, MessageState, AudioMessage, ImageMessage } from '@/types';
import MessageItem from '@/components/message/MessageItem';
import { Input, InputField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import RecordingIndicator from '@/components/message/Recording';
import InsertMedia from '@/components/message/InsertMedia';
import { EmojiKeyboard, EmojiType } from 'rn-emoji-keyboard';
import { Box } from '@/components/ui/box';
import { Keyboard } from 'react-native';
import {saveMessage} from '@/storage'
import { resizeImageWithAspectRatio, uniqueByProperty } from '@/utils'
import * as FileSystem from "expo-file-system"
import { router, useNavigation, useRootNavigationState } from 'expo-router';
import * as Storage from '@/storage';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import * as Net from '@/net'
import { FlashList } from '@shopify/flash-list';
import { OnlineLight } from '@/components/message/Online';


type UpdateMessages = {
  (newMessages: Message[]): void;
  (updateFn: (pre: Message[]) => Message[]): void;
};


export default function ChatScreen() {
  // const { roomId, isLogedIn }  = useLocalSearchParams<{ roomId: string, isLogedIn: string }>();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputing, setInputing] = React.useState(false);
  const [inputText, setInputText] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [openEmojiPicker, setOpenEmojiPicker] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const navigation = useNavigation();
  const rootNavigationState = useRootNavigationState();
  const msgListRef = React.useRef<FlashList<Message>>(null)
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [audioRecording, setAudioRecording] = React.useState<Recording>()
  const recordDuration = React.useRef(0)
  const messagesRef = React.useRef<Message[]>([]);  // 创建 messages 的引用
  const usernameRef = React.useRef<string>('')
  const roomIdRef = React.useRef<string>('')
  const [roomId, setRoomId] = React.useState<string>('')
  const connectExpire = React.useRef<number>(0) 
  const pingTaskRef = React.useRef<NodeJS.Timeout | null>(null)


  const logout = () => {
    if (!rootNavigationState?.key) {
      setTimeout(() => {
        logout()
      }, 500)
    } else {
      Net.disconnect()
      router.replace({ pathname: '/login', params: { isLogout: 'true' } })
    }
  }

  const addAvatar = async (messages: Message[]) => {
    try {
      for (const msg of messages) {
        if (msg.avatar && msg.avatar.startsWith('http')) {
          await Storage.setAvatar(msg.senderId, msg.avatar)
        }
      }
      return Promise.all(messages.map(async msg => {
        msg.avatar = await Storage.getAvatar(msg.senderId)
        return msg
      }))
    } catch (error) {
      // Alert.alert('[index.addAvatar]',`[index.addAvatar]获取头像失败: ${JSON.stringify(error)}`)
      return []
    }
  }

  const updateRoomId = (roomId: string) => {
    setRoomId(roomId)
    roomIdRef.current = roomId
  }
  const updateMessages: UpdateMessages = async (input)  => {
    if (typeof input === 'function') {
      messagesRef.current = await addAvatar(uniqueByProperty(input(messagesRef.current), item => item.senderId + item.msgId))
    } else {
      messagesRef.current = await addAvatar(uniqueByProperty(input, item => item.senderId + item.msgId))
    }
    setMessages(messagesRef.current)
  }
    
  const handleOnChange = (text: string) => {
    if (text !== "" && !inputing) {
      setInputing(pre => !pre)
    }
    if (text === "" && inputing) {
      setInputing(pre => !pre)
    }
    setInputText(text)
  };
  const startRecording = async () => {
    recordDuration.current = 0;
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          recordDuration.current = status.durationMillis
        }
      );
      setAudioRecording(recording)
      console.log('Recording started');
    } catch (err) {
      // Alert.alert('[index.startRecording]',`failed to start recording: ${JSON.stringify(err)}`)
      console.error('Failed to start recording', err);
    }
  }
  const stopRecording = async () => {
    console.log('Stopping recording..');
    setAudioRecording(undefined);
    await audioRecording?.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const uri = audioRecording?.getURI();
    console.log('Recording stopped and stored at', uri);

  }

  const handleSend = async () => {
    setInputing(false)
    const message = {
      msgId: Date.now(),
      senderId: usernameRef.current,
      content: { text: inputText },
      type: MessageType.TEXT,
      uuid: Date.now(),
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomIdRef.current,
    }
    setInputText("")
    updateMessages(pre => [message, ...pre])
    msgListRef.current?.scrollToOffset({ offset: 0 })
    saveMessage(message).then(id => {
      sendMessage(message, id)
    }).catch(e => {
      // Alert.alert('[index.handleSend]',`保存消息失败: ${JSON.stringify(e)}`)
      console.log('save message error: ', e)
    })
  }

  const sendMessage = (msg: Message, id: number) => {
    console.log(`message to send: ${JSON.stringify(msg)}`)
    Net.sendMessage(msg, roomIdRef.current,
      (uuid: number) => {
        console.log('uuid: ', uuid.toString())
        console.log('id: ', id)
        Storage.updateUUID(id, uuid)
        .then(() => {
          console.log("send message success")
          updateMessages(pre => pre.map(m => (
            msg.senderId + msg.msgId === m.senderId + m.msgId ? {
              ...m, state: MessageState.SUCCESS, uuid: uuid
            } : m
          )))
        }).catch(e => {
          // Alert.alert('[index.sendMessage]',`更新uuid失败: ${JSON.stringify(e)}`)
          console.log('updateUUID error: ', e)
        })
      },
      () => {
        logout()
      },
      () => {
        Storage.failed(roomIdRef.current, msg.msgId).then(() => {
          console.log("send message failed")
        })
      }
    )
  }


  const handleAudioPressIn = () => {
    setRecording(true)
    startRecording()
  }

  const handleAudioPressOut= async () => {
    setRecording(false)
    await stopRecording() 
    const uri = audioRecording?.getURI()
    const duration = recordDuration.current
    if (!uri) {
      return
    }
    const message = {
      msgId: Date.now(),
      senderId: usernameRef.current,
      content: { audio: uri!, duration: duration} as AudioMessage,
      type: MessageType.AUDIO,
      uuid: Date.now(),
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomIdRef.current
    }
    updateMessages(pre => [message, ...pre])
    msgListRef.current?.scrollToOffset({ offset: 0 })
    try {
      const id = await saveMessage(message)
      const url = await Net.uploadFile(uri)
      sendMessage({ ...message, content: { ...message.content, audio: url } as AudioMessage }, id)
      console.log("send audio success")
    } catch (error) {
      // Alert.alert('[index.handleAudioPressOut]',`保存消息失败: ${JSON.stringify(error)}`)
      console.log("error: ", error)
    }
  }

  const handleMedia = async (uri: string) => {
    console.log('media uri: ', uri)

    const thumbnailUri = FileSystem.cacheDirectory + `/${roomIdRef.current}/${Date.now().toString()}_thumbnial.png`
    const imageUri = FileSystem.cacheDirectory + `/${roomIdRef.current}/${Date.now().toString()}.png`
    console.log(`thumbnail uri: ${thumbnailUri}`)
    console.log(`image uri: ${imageUri}`)

    console.log("message updatd")
    // await RNFS.copyFile(uri, thumbnailUri)
    await FileSystem.copyAsync({
      from: uri,
      to: thumbnailUri
    })
    await FileSystem.copyAsync({
      from: uri,
      to: imageUri
    })
    
    console.log("resizing image")
    // scaleAndSaveImage(uri, thumbnailUri)
    resizeImageWithAspectRatio(uri, 100, thumbnailUri)
    console.log("resizing done")
    const message = {
      msgId: Date.now(),
      senderId: usernameRef.current,
      content: {
        thumbnail: thumbnailUri,
        img: imageUri
      },
      uuid: Date.now(),
      type: MessageType.IMAGE,
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomIdRef.current
    }
    updateMessages(pre => [
      message, ...pre
    ])
    console.log('save message to database')
    msgListRef.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
    const id = await saveMessage(message)
    const thumbnailUrl = await Net.uploadFile(thumbnailUri)
    const imageUrl = await Net.uploadFile(imageUri)
    sendMessage({...message, content: {thumbnail: thumbnailUrl, img: imageUrl} as ImageMessage}, id)
  }

  const handleEmojiPick = (emoji: EmojiType) => {
    setInputText(pre => pre + emoji.emoji)
    setInputing(true)
  }


  const onMessagePulled = async (msgs: Message[]) => {
    if (msgs.length === 0) {
      return
    }
    //图片，视频下载缩略图
    const newMessages = await Promise.all(msgs.map(async msg => {
      if (msg.type === MessageType.IMAGE || msg.type === MessageType.VIDEO) {
        console.log(`start download image file: ${(msg.content as { thumbnail: string }).thumbnail}`)
        const fileUrl = await Net.downloadFile((msg.content as { thumbnail: string }).thumbnail, roomIdRef.current)
        console.log(`download and save file to : ${fileUrl}`)
        return { ...msg, content: { ...(msg.content as object), thumbnail: fileUrl } } as Message
      }
      if (msg.type === MessageType.AUDIO) {
        console.log(`start download auto file: ${(msg.content as AudioMessage).audio}`)
        const fileUrl = await Net.downloadFile((msg.content as AudioMessage).audio, roomIdRef.current)
        console.log(`download and save audo to : ${fileUrl}`)
        return { ...msg, content: { ...(msg.content as AudioMessage), audio: fileUrl } } as Message
      }
      console.log(`not image or video or audio: ${msg.type}`)
      return msg
    }))
    await Storage.saveMessages(newMessages)
    updateMessages(pre => [...newMessages, ...pre])
    //ack
    await Net.ackMessages(roomIdRef.current, msgs[0].uuid)
    if (msgs.length >= 100) {
      syncMessages()
    }
  }

  const getLocalMessages = async () => {
    try {
      const messages = await Storage.getMessages(roomIdRef.current, "before", 100)
      console.log('getMessages: ', messages)
      updateMessages(messages)
    } catch (error) {
      // Alert.alert('[index.getLocalMessages]',`获取本地消息失败: ${JSON.stringify(error)}`)
      console.log('error: ', error)
    }
  }

  const syncMessages = async () => {
    Net.syncMessages(roomIdRef.current, onMessagePulled, () => {
      logout()
    }, (e) => {
      // Alert.alert('[index.syncMessages]',`同步消息失败: ${JSON.stringify(e)}`)
      console.log("sync message failed: ", e)
    })
  }
  useEffect(() => {
    navigation.setOptions({
      headerTitle: roomIdRef.current,
      headerLeft: () => (
        <OnlineLight getExpire={() => connectExpire.current}/>
      )
    })
  }, [navigation, roomId])

  const pingEvery15Seconds = () => {
    if (pingTaskRef.current) {
      clearInterval(pingTaskRef.current)
    }
    pingTaskRef.current = setInterval(() => {
      Net.ping()
    }, 15000)
  }

  useEffect(() => {
    Promise.all([
     Storage.getValue('username'),
     Storage.getValue('lastLoginRoom') 
    ]).then(([username, lastLoginRoom]) => {
      if (!username || !lastLoginRoom) {
        logout()
        return
      }
      usernameRef.current = username!
      updateRoomId(lastLoginRoom)
      //显示现有消息
      getLocalMessages()
      //拉取最新消息
      syncMessages()
      console.log(`connect to room: ${roomIdRef.current}`)
      Net.connect(roomIdRef.current, () => {
        console.log("connected")
        connectExpire.current = Date.now() + 30000
        pingEvery15Seconds()
        syncMessages()
      }, (msg: string) => {
        if (msg === "notify") {
          syncMessages()
        } else if (msg === "pong") {
          console.log("pong")
          connectExpire.current = Date.now() + 30000
        }
      }, () => {
        logout()
      })
    })
  }, [])

  const handleOnEndReached = () => {
    if (messages.length === 0) {
      return
    }
    console.log("current messages: ", messages)
    console.log("handleOnEndReached, uuid: ", messages[messages.length-1].uuid)
    Storage.getMessages(roomIdRef.current, 'before', 10, messages[messages.length-1].uuid).then(messages => {
      if (messages.length === 0) {
        Net.pullMessage(roomIdRef.current, messages[messages.length-1].uuid, 'before', false,
          onMessagePulled,
          () => {},
          () => {})
      } else {
        updateMessages(pre => [...pre, ...messages])
      }
    })
  }

  const retry = (msg: Message) => {
    
  }

  const flatListItemRender = ({ item }: {item: Message}) => {
    console.log('render: ', item)
    return <MessageItem msg={item} retry={retry}/>
  }

  return (
    <VStack className='px-4' style={styles.rootContainer}>
      <FlashList
        ref={msgListRef}
        data={messages}
        showsVerticalScrollIndicator={false}
        // style={styles.messageContainer}
        renderItem={flatListItemRender}
        keyExtractor={(item: Message) => {
          return item.senderId + item.msgId;
        }}
        inverted
        onEndReached={handleOnEndReached}
        estimatedItemSize={100}
      />
      <HStack space='sm' className='px-2' style={styles.bottomStack}>
        {!speaking ?
          <AudioLines onPress={() => setSpeaking(true)} color={'black'} style={styles.audio} /> :
          <KeyboardIcon onPress={() => setSpeaking(false)} color={'black'} style={styles.audio} />
        } 
        {!speaking ?
          <Input
            variant="outline"
            size="md"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            style={styles.inputContainer}
          >
            <InputField onPress={() => setOpenEmojiPicker(false)} onFocus={() => setOpenEmojiPicker(false)} value={inputText} onChangeText={handleOnChange} />
          </Input> :

          <Pressable
            onPressIn={handleAudioPressIn}
            onPressOut={handleAudioPressOut}
            style={styles.inputContainer}
          >
            {recording ? <RecordingIndicator /> : <Text>按住说话</Text>}
          </Pressable>
        }
        <Smile onPress={() => {
          setOpenEmojiPicker(!openEmojiPicker)
          Keyboard.dismiss()
        }} color={'black'} style={styles.emojiIcon} />
        {inputing ?
          <Button className='px-1' onPress={handleSend} style={styles.sendBtn} ><Text size='md'>发送</Text></Button> :
          <InsertMedia style={styles.imageIcon} handleMedia={handleMedia}/>
        }
      </HStack>
      {openEmojiPicker &&
        <Box style={styles.emojiKeyboard}>
          <EmojiKeyboard
            onEmojiSelected={handleEmojiPick}
            allowMultipleSelections={true}
          />
        </Box>
      }
    </VStack>
  );
}


const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    paddingTop: 10,
  },
  messageContainer: {
    height: '100%'
  },
  messageStack: {
    backgroundColor: '#f5f5f5',
  },
  bottomStack: {
    width: '100%',
    height: 75,
    alignItems: 'center',
  },
  audio: {
    flex: 0.1
  },
  recordInput: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3, // 可选：圆角
    borderStyle: 'solid', // 可选：边框样式
    borderWidth: 1, // 可选：边框宽度
    borderColor: 'lightgray'
  },
  inputContainer: {
    flexDirection: 'row',
    flex: 1,
    height: '55%', // 与 Input 的高度一致
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'black', // 可选：背景颜色
    backgroundColor: '#f0f0f0', // 可选：背景颜色
    borderRadius: 3, // 可选：圆角
    borderStyle: 'solid', // 可选：边框样式
    borderWidth: 1, // 可选：边框宽度
    borderColor: 'lightgray'
  },
  emojiIcon: {
    flex: 0.1
  },
  imageIcon: {
    flex: 0.1,
    alignSelf: 'center' 
  },
  sendBtn: {
    flex: 0.2,
    backgroundColor: 'lightgreen' 
  },
  emojiKeyboard: {
    width: '100%',
    height: 300 
  }
});