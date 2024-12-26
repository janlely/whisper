import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Smile, AudioLines, KeyboardIcon } from 'lucide-react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { MessageData, MessageType } from '@/types';
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
import FileSystem from "expo-file-system"
import { useImageManipulator } from 'expo-image-manipulator';



export default function ChatScreen() {
  const [roomId, setRoomId] = React.useState('');
  const [messages, setMessages] = React.useState<MessageData[]>([]);
  const [inputing, setInputing] = React.useState(false);
  const [inputText, setInputText] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [openEmojiPicker, setOpenEmojiPicker] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const navigation = useNavigation();

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
  }

  const handleAudioPressIn = () => {
    setRecording(true)
  }

  const handleAudioPressOut= () => {
    setRecording(false)
  }

  const handleMedia = (uri: string) => {
    console.log('Document directory: ', FileSystem.documentDirectory);
    console.log('media uri: ', uri)
    console.log('cache directory: ', FileSystem.cacheDirectory)

    const thumbnailUri = FileSystem.cacheDirectory + `/${roomId}/${Date.now().toString()}_thumbnial.png`
    const imageUri = FileSystem.cacheDirectory + `/${roomId}/${Date.now().toString()}.png`
    console.log("hello world")

    setMessages(pre => [
      ...pre,
      {
        msg: {
          msgId: '16',
          senderId: 'jacobo',
          content: {
            text: 'new message'
          },
          type: 0,
          uuid: '16',
        },
        success: true,
        failed: false,
        isSender: false 
      }
    ])
    console.log("message updatd")
    // await RNFS.copyFile(uri, thumbnailUri)
    Promise.all([
      FileSystem.copyAsync({
        from: uri,
        to: thumbnailUri
      }),
      FileSystem.copyAsync({
        from: uri,
        to: imageUri
      })
    ]).then(() => {
      useImageManipulator(thumbnailUri).resize({
        width: 100,
        height: 100
      })
      setMessages(pre => [
        ...pre,
        {
          msg: {
            msgId: Date.now().toString(),
            senderId: 'me',
            content: {
              thumbnail: thumbnailUri,
              img: imageUri
            },
            uuid: Date.now().toString(),
            type: MessageType.IMAGE
          },
          success: true,
          failed: false,
          isSender: true
        }
      ])
      console.log('save message to database')
      saveMessage({
        msg: {
          msgId: Date.now().toString(),
          senderId: 'me',
          content: {
            thumbnail: "hello world",
            img: 'hello world'
          },
          uuid: Date.now().toString(),
          type: MessageType.IMAGE
        },
        success: true,
        failed: false,
        isSender: true
      })
    }).catch(err => console.log(err))

  }

  const handleEmojiPick = (emoji: EmojiType) => {
    setInputText(pre => pre + emoji.emoji)
    setInputing(true)
  }
  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: '好好学习',
    })
    setMessages([
      {
        msg: {
          msgId: '1',
          senderId: 'me',
          content: {
            text: 'hello'
          },
          type: 0,
          uuid: '1',
        },
        success: true,
        failed: false,
        isSender: true
      },
      {
        msg: {
          msgId: '2',
          senderId: 'jacobo',
          content: {
            text: 'hello world this is a long text, i don\'n know how it will look like',
          },
          type: 0,
          uuid: '2',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '3',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '3',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '4',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '4',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '5',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '5',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '6',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '6',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '7',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '7',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '8',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '8',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '9',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '9',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '10',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '10',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '11',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '11',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '12',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '12',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '13',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '13',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '14',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '14',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '15',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '15',
        },
        success: true,
        failed: false,
        isSender: false 
      },
      {
        msg: {
          msgId: '16',
          senderId: 'jacobo',
          content: {
            text: 'hello world'
          },
          type: 0,
          uuid: '16',
        },
        success: true,
        failed: false,
        isSender: false 
      },
    ])
  }, [])

  // const migrateDbIfNeeded = async () => {
    
  // }
  return (
// {/* <SQLiteProvider databaseName="test.db" onInit={migrateDbIfNeeded}> */}
    <VStack className='px-4' style={styles.rootContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.messageContainer}
      >
        <VStack space='md' style={styles.messageStack}>
          {messages.map((item) => {
            return <MessageItem key={item.msg.msgId} msg={item} />
          })}
        </VStack>
      </ScrollView>
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
// </SQLiteProvider>
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