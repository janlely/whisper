import { Pressable, StyleSheet, FlatList } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Smile, AudioLines, KeyboardIcon } from 'lucide-react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { resizeImageWithAspectRatio } from '@/utils'
import * as FileSystem from "expo-file-system"
import { router, useLocalSearchParams } from 'expo-router';
import * as Storage from '@/storage';
import { Audio } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import * as Net from '@/net'
import { FlashList } from '@shopify/flash-list';

type UpdateMessages = {
  // 重载签名 1：接受一个 Message[]，表示直接传递新的消息列表
  (newMessages: Message[]): void;

  // 重载签名 2：接受一个 (pre: Message[]) => Message[]，表示通过回调函数更新消息列表
  (updateFn: (pre: Message[]) => Message[]): void;
};


export default function ChatScreen() {
  const { roomId }  = useLocalSearchParams<{ roomId: string }>();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputing, setInputing] = React.useState(false);
  const [inputText, setInputText] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [openEmojiPicker, setOpenEmojiPicker] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const navigation = useNavigation();
  const msgListRef = React.useRef<FlashList<Message>>(null)
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [audioRecording, setAudioRecording] = React.useState<Recording>()
  const recordDuration = React.useRef(0)
  const messagesRef = React.useRef<Message[]>([]);  // 创建 messages 的引用

  const updateMessages: UpdateMessages = (input)  => {
    if (typeof input === 'function') {
      messagesRef.current = input(messagesRef.current);
      setMessages(pre => input(pre))
    } else {
      messagesRef.current = input;
      setMessages(input)
    }
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

  const handleSend = () => {
    setInputing(false)
    const message = {
      msgId: Date.now(),
      senderId: 'me',
      content: { text: inputText },
      type: MessageType.TEXT,
      uuid: Date.now(),
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomId
    }
    updateMessages(pre => [message, ...pre])
    msgListRef.current?.scrollToOffset({ offset: 0 })
    saveMessage(message).then(id => {
      setInputText("")
      sendMessage(message, id)
    })
  }

  const sendMessage = (msg: Message, id: number) => {
    Net.sendMessage(msg, roomId,
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
          console.log('updateUUID error: ', e)
        })
      },
      () => {
        router.replace('/login')
      },
      () => {
        Storage.failed(roomId, msg.msgId).then(() => {
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
      senderId: 'me',
      content: { audio: uri!, duration: duration} as AudioMessage,
      type: MessageType.AUDIO,
      uuid: Date.now(),
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomId
    }
    updateMessages(pre => [message, ...pre])
    msgListRef.current?.scrollToOffset({ offset: 0 })
    try {
      const id = await saveMessage(message)
      const url = await Net.uploadFile(uri)
      sendMessage({ ...message, content: { ...message.content, audio: url } as AudioMessage }, id)
      console.log("send audio success")
    } catch (error) {
      console.log("error: ", error)
    }
  }

  const handleMedia = async (uri: string) => {
    console.log('media uri: ', uri)

    const thumbnailUri = FileSystem.cacheDirectory + `/${roomId}/${Date.now().toString()}_thumbnial.png`
    const imageUri = FileSystem.cacheDirectory + `/${roomId}/${Date.now().toString()}.png`
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
      senderId: 'me',
      content: {
        thumbnail: thumbnailUri,
        img: imageUri
      },
      uuid: Date.now(),
      type: MessageType.IMAGE,
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomId
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
  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: roomId,
    })
    Storage.getMessages(roomId, 'before', 10).then(messages => {
      console.log("messages size: ", messages.length)
      updateMessages(messages)
    })
    Net.connect(roomId, () => {
      console.log("connected")
    }, async (msg: string) => {
      if (msg === "notify") {
        try {
          const msgs: Message[] = await Storage.getMessages(roomId, 'before', 1)
          Net.pullMessage(roomId, msgs[0].uuid, "after", async (msgs: Message[]) => {
            //图片，视频下载缩略图
            const newMessages = await Promise.all(msgs.map(async msg => {
              if (msg.type === MessageType.IMAGE || msg.type === MessageType.VIDEO) {
                const fileUrl = await Net.downloadFile((msg.content as {thumbnail: string}).thumbnail, roomId)
                return {...msg, content: {...(msg.content as object), thumbnail: fileUrl}} as Message
              }
              return msg
            }))
            updateMessages(pre => [...newMessages, ...pre])
          }, () => {
            router.replace('/login')
          }, () => {
            console.log("pull message failed")
          })
        } catch (error) {
          console.log("pullMessage error: ", error)
        }
      }
    }, () => {
      router.replace('/login')
    })
  }, [])

  const handleOnEndReached = () => {
    if (messages.length === 0) {
      return
    }
    console.log("current messages: ", messages)
    console.log("handleOnEndReached, uuid: ", messages[messages.length-1].uuid)
    Storage.getMessages(roomId, 'before', 10, messages[messages.length-1].uuid).then(messages => {
      updateMessages(pre => [...pre, ...messages])
    })
  }

  const retry = (msg: Message) => {
    
  }

  const flatListItemRender = ({ item }: {item: Message}) => {
    console.log('render: ', item.content)
    return <MessageItem msg={item} retry={retry}/>
  }

  return (
    <VStack className='px-4' style={styles.rootContainer}>
      <FlashList
        ref={msgListRef}
        data={messages}
        showsVerticalScrollIndicator={false}
        style={styles.messageContainer}
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