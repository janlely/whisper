import { Dimensions, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from "expo-router";
import Animated from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { useEffect, useRef, useState } from "react";
import { getImagesMessages} from "@/storage"
import { ImageMessage } from "@/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export default function ImagesScreen() {
  const { roomId, uuid } = useLocalSearchParams<{ roomId: string, uuid: string }>();
  const [images, setImages] = useState<string[]>([])
  const [initIndex, setInitIndex] = useState(0)
  const viewRef = useRef<FlashList<string>>(null)


  useEffect(() => {
    console.log("got roomId: ", roomId)
    console.log("got uuid: ", uuid)
    getImagesMessages(roomId)
      .then(msges => {
        console.log("got msges: ", msges.length)
        setImages(msges.map(msg => {
          const imgMsg = msg.content as ImageMessage
          console.log("img: ", imgMsg.img)
          return imgMsg.img
        }))
        const index = msges.findIndex(msg => msg.uuid === Number(uuid))
        console.log("index: ", index)
        setInitIndex(index)
      }).catch(e => console.error(e))
  }, [])

  useEffect(() => {
    console.log("images updated")
    if (viewRef.current) {
      console.log("listRef is not null2")
    }
  }, [images, initIndex])

  const renderItem = ({ item }: { item: string }) => {
    console.log('item: ', item)
    return (
      <Image
        style={styles.image}
        source={{ uri: item }}
        contentFit='contain'
      />
    )
  }

  const tapGestrue = Gesture.Tap()
    .onEnd(() => {
      router.back()
    })
    .runOnJS(true)

  return (
    <Animated.View
      style={styles.container}
      sharedTransitionTag={'imageViewer'}
    >
      {images.length > 0 && initIndex >= 0 &&
        <GestureDetector gesture={tapGestrue}>
          <View collapsable={false}>
            <FlashList
              ref={viewRef}
              horizontal
              initialScrollIndex={initIndex}
              data={images}
              renderItem={renderItem}
              estimatedItemSize={SCREEN_WIDTH}
              snapToInterval={SCREEN_WIDTH}
            />
          </View>
        </GestureDetector>
      }
    </Animated.View>
  )
}



const styles = StyleSheet.create({
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  container: {
    backgroundColor: 'black',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  }
})