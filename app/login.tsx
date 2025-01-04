import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { StyleSheet } from 'react-native';
import { router } from "expo-router";
import React, { useEffect } from "react";
import {login} from '@/net'
import Animated, { useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import * as Storage from '@/storage'

export default function LoginScreen() {

  const [roomId, setRoomId] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [optToken, setOptToken] = React.useState('');
  const optTokenX = useSharedValue(0)
  const [borderColor, setBorderColor] = React.useState('lightgray')

  const handleOnPress = () => {
    //TODO: authenticate
    console.log("go to index, roomId: ", roomId)
    login(roomId, username, optToken,
      async () => {
        await Storage.setValue('username', username)
        router.replace({
          pathname: '/',
          params: { roomId: roomId },
        });
      },
      () => {
        setBorderColor('red')
        shakeOptToken()
        setTimeout(() => {
          setOptToken('')
          setBorderColor('lightgray')
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

  useEffect(() => {
    setRoomId('好好学习')
  }, [])
  return (
    <Center style={{ width: '100%', height: '100%' }}>
      <VStack space="md" style={{ width: '55%' }}>
        <Input
          variant="outline"
          size="md"
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}
          style={styles.input}
        >
          <InputField value={username} placeholder="Username" onChangeText={(text) => {setUsername(text)}} />
        </Input>
        <Animated.View style={{ transform: [{ translateX: optTokenX }] }}>
          <Input
            variant="outline"
            size="md"
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}
            style={[styles.input, { borderColor: borderColor }]}
          >
            <InputField value={optToken} type="password" placeholder="OptToken" onChangeText={(text) => { setOptToken(text) }} />
          </Input>
        </Animated.View>
        <Input
          variant="outline"
          size="md"
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}
          style={styles.input}
        >
          <InputField value={roomId} onChangeText={(text) => {setRoomId(text)}} />
        </Input>
        <Button
          className="ml-auto w-full"
          onPress={handleOnPress}
        >
          <ButtonText className="text-typography-0">登录</ButtonText>
        </Button>
      </VStack>
    </Center>
  )
}



const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: 'lightgray'
  }
})