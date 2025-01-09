import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from "expo-router";
import React, { useEffect } from "react";
import {login} from '@/net'
import Animated, { useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import * as Storage from '@/storage'
import * as Net from '@/net'

export default function LoginScreen() {

  const [roomId, setRoomId] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [optToken, setOptToken] = React.useState('');
  const optTokenX = useSharedValue(0)
  const roomIdX = useSharedValue(0)
  const usernameX = useSharedValue(0)
  const [optTokenBorderColor, setOptTokenBorderColor] = React.useState('lightgray')
  const [roomIdBorderColor, setRoomIdBorderColor] = React.useState('lightgray')
  const [usernameBorderColor, setUsernameBorderColor] = React.useState('lightgray')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleOnPress = () => {
    setIsLoading(true)
    if (!username) {
      setUsernameBorderColor('red')
      shakeUsername()
      setTimeout(() => {
        setUsernameBorderColor('lightgray')
      }, 600)
      setIsLoading(false)
      return
    }

    if (!optToken) {
      setOptTokenBorderColor('red')
      shakeOptToken()
      setTimeout(() => {
        setOptTokenBorderColor('lightgray')
      }, 600)
      setIsLoading(false)
      return
    }

    if (!roomId) {
      setRoomIdBorderColor('red')
      shakeRoomId()
      setTimeout(() => {
        setRoomIdBorderColor('lightgray')
      }, 600)
      setIsLoading(false)
      return
    }

    console.log('try login')
    login(roomId, username, optToken,
      async (imgApiKey, avatar) => {
        console.log("go to index, roomId: ", roomId)
        await Storage.setValue('username', username)
        await Storage.setValue('imgApiKey', imgApiKey)
        await Storage.setValue('lastLoginRoom', roomId)
        await Storage.setAvatar(username, avatar)
        
        router.replace('/')
        setIsLoading(false)
      },
      () => {
        setIsLoading(false)
        setOptTokenBorderColor('red')
        shakeOptToken()
        setTimeout(() => {
          setOptToken('')
          setOptTokenBorderColor('lightgray')
        }, 600)
      }
    )
    
  }

  const shakeOptToken = () => {
    optTokenX.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    )
  }

  const shakeUsername = () => {
    usernameX.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    )
  }

  const shakeRoomId = () => {
    roomIdX.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    )
  }
  useEffect(() => {
    Net.disconnect()
    Storage.getValue('lastLoginRoom').then((value) => {
      setRoomId(value ?? '好好学习')
    }).catch((error) => {
      console.log('lastLoginRoom error: ', error)
      setRoomId('好好学习')
    })
  }, [])
  return (
    <Center style={{ width: '100%', height: '100%' }}>
      <VStack space="md" style={{ width: '55%' }}>
        <Animated.View style={{ transform: [{ translateX: usernameX }] }}>
          <Input
            variant="outline"
            size="md"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            style={[styles.input, { borderColor: usernameBorderColor}]}
          >
            <InputField value={username} placeholder="Username" onChangeText={(text) => { setUsername(text) }} />
          </Input>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: optTokenX }] }}>
          <Input
            variant="outline"
            size="md"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            style={[styles.input, { borderColor: optTokenBorderColor}]}
          >
            <InputField value={optToken} type="password" placeholder="OptToken" onChangeText={(text) => { setOptToken(text) }} />
          </Input>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: roomIdX }] }}>
          <Input
            variant="outline"
            size="md"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            style={[styles.input, { borderColor: roomIdBorderColor}]}
          >
            <InputField value={roomId} onChangeText={(text) => { setRoomId(text) }} />
          </Input>
        </Animated.View>
        {!isLoading ?
          <Button
            className="ml-auto w-full"
            onPress={handleOnPress}
            style={styles.loading}
          >
            <ButtonText className="text-typography-0">登录</ButtonText>
          </Button> :
          <View
            className="ml-auto w-full"
            style={styles.loading}
          >
            <ActivityIndicator size="large" color='white' /> 
          </View>
        }
      </VStack>
    </Center>
  )
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: 'lightgray'
  },
  loading: {
    backgroundColor: '#5c6370',
    borderRadius: 5,
    height: 40,
    justifyContent: 'center'
  }
})