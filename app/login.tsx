import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { StyleSheet } from 'react-native';
import { router } from "expo-router";

export default function LoginScreen() {

  const handleOnPress = () => {
    //TODO: authenticate
    router.replace('/');
  }
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
          <InputField placeholder="Username" />
        </Input>
        <Input
          variant="outline"
          size="md"
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}
          style={styles.input}
        >
          <InputField type="password" placeholder="OptToken" />
        </Input>
        <Input
          variant="outline"
          size="md"
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}
          style={styles.input}
        >
          <InputField value="好好学习" />
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
    height: 40
  }
})