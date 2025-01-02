import { ScrollView, Pressable, StyleSheet, FlatList } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Smile, AudioLines, KeyboardIcon } from 'lucide-react-native';
import React, { useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Message, MessageType, MessageState, AudioMessage } from '@/types';
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
import { useLocalSearchParams } from 'expo-router';
import { getMessages } from '@/storage';
import { Audio } from 'expo-av';



export default function ChatScreen() {
  const { roomId }  = useLocalSearchParams<{ roomId: string }>();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputing, setInputing] = React.useState(false);
  const [inputText, setInputText] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [openEmojiPicker, setOpenEmojiPicker] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const navigation = useNavigation();
  const msgListRef = useRef<FlatList<Message>>(null)
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const handleOnChange = (text: string) => {
    if (text !== "" && !inputing) {
      setInputing(pre => !pre)
    }
    if (text === "" && inputing) {
      setInputing(pre => !pre)
    }
    setInputText(text)
  };

  const handleSend = () => {
    setInputing(false)
    const message = {
      msgId: Date.now().toString(),
      senderId: 'me',
      content: { text: inputText },
      type: MessageType.TEXT,
      uuid: Date.now().toString(),
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomId
    }
    setMessages(pre => [message, ...pre])
    msgListRef.current?.scrollToOffset({ offset: 0 })
    saveMessage(message)
    setInputText("")
    //TODO: send to server
  }

  const handleAudioPressIn = () => {
    setRecording(true)
    audioRecorder.record();
  }

  const handleAudioPressOut= async () => {
    setRecording(false)
    await audioRecorder.stop()
    const message = {
      msgId: Date.now().toString(),
      senderId: 'me',
      content: { audio: audioRecorder.uri } as AudioMessage,
      type: MessageType.AUDIO,
      uuid: Date.now().toString(),
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomId
    }
    setMessages(pre => [message, ...pre])
    msgListRef.current?.scrollToOffset({ offset: 0 })
    saveMessage(message)
    //TODO: send to server
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
      msgId: Date.now().toString(),
      senderId: 'me',
      content: {
        thumbnail: thumbnailUri,
        img: imageUri
      },
      uuid: Date.now().toString(),
      type: MessageType.IMAGE,
      state: MessageState.SENDING,
      isSender: true,
      roomId: roomId
    }
    setMessages(pre => [
      message, ...pre
    ])
    console.log('save message to database')
    saveMessage(message)
    msgListRef.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  }

  const handleEmojiPick = (emoji: EmojiType) => {
    setInputText(pre => pre + emoji.emoji)
    setInputing(true)
  }
  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: roomId,
    })
    getMessages(roomId, 'before', 10).then(messages => {
      setMessages(messages)
    })
  }, [])

  const handleOnEndReached = () => {
    getMessages(roomId, 'before', 10, messages[messages.length-1].uuid).then(messages => {
      setMessages(pre => [...pre, ...messages])
    })
  }
  return (
    <VStack className='px-4' style={styles.rootContainer}>
      <FlatList
        ref={msgListRef}
        data={messages}
        showsVerticalScrollIndicator={false}
        style={styles.messageContainer}
        renderItem={({ item }) => <MessageItem key={item.msgId} msg={item} />}
        inverted
        onEndReached={handleOnEndReached}
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