import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { FlashList } from "@shopify/flash-list";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Dimensions, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Button, ButtonText } from '../ui/button';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

type FullScreenImageViewerProps = {
  images: string[]
}
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export default function FullScreenImageViewer() {

  const [images, setImages] = React.useState<string[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const offsetX = useSharedValue(0)
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true
    });

    console.log(result);

    if (!result.canceled) {
      setImages(result.assets.map((asset) => asset.uri));
      setModalVisible(true)
    }
  };

  const tapGestrue = Gesture.Tap()
    .onEnd(() => {
      setModalVisible(false)
    })

  const panGesture = Gesture.Pan()
    .minDistance(1)
    .onUpdate((e) => {
      offsetX.value  = offsetX.value > e.translationX ? offsetX.value - e.translationX : 0
    })
    .onEnd((e) => {
      offsetX.value = Math.round(offsetX.value / SCREEN_WIDTH) * SCREEN_WIDTH
    })
    .runOnJS(true)
    
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }]
  }));

  return (
    <View style={styles.container}>
      <Button onPress={pickImage}>
        <ButtonText>选择图片</ButtonText>
      </Button>
      {modalVisible && (
        <GestureHandlerRootView>
          <GestureDetector gesture={Gesture.Simultaneous(tapGestrue, panGesture)}>
            <Animated.ScrollView horizontal={true} style={[styles.overlay, animatedStyles]}>
              {images.map((item, idx) => {
                return (
                  // <View key={idx} style={styles.imgContainer}>
                    <Image
                      key={idx}
                      style={styles.img}
                      source={{ uri: item }}
                      contentFit="contain"
                    />
                  // </View>
                )
              })}
            </Animated.ScrollView>
          </GestureDetector>
        </GestureHandlerRootView>
      )}
    </View>
  )
}


const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 半透明背景
    height: '100%',
    width: '100%'
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%'
  },
  imgContainer: {
    width: 500,
    height: 500,
    backgroundColor: 'white',
    flexDirection: 'row',
    flex: 1
  },
  img: {
    // width: 500,
    // height: 500 
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH 
  }
})