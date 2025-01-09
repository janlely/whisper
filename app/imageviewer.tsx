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
import * as Storage from '@/storage'
import * as Net from '@/net'

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
        console.log("got msges: ", msges)
        setImages(msges.map(msg => (msg.content as ImageMessage).img))
        const index = msges.findIndex(msg => msg.uuid === Number(uuid))
        console.log("index: ", index)
        setInitIndex(index)
        console.log("downloading  images")
        Promise.all(msges.map(async msg => {
          //如果原图没下载，先下载原图
          const messageContent = msg.content as ImageMessage
          if ((msg.content as ImageMessage).img.startsWith('http')) {
            const fileUrl = await Net.downloadFile(messageContent.img, roomId)
            await Storage.updateContent(roomId, msg.uuid, { ...(msg.content as ImageMessage), img: fileUrl })
            console.log("image downloaded, fileUrl: ", fileUrl)
            return fileUrl
          } else {
            return messageContent.img
          }
        })).then((imgs) => setImages(imgs))
        .catch(e => console.error('download image error: ',e))
      }).catch(e => console.error('get images error', e))
  }, [])

  useEffect(() => {
    console.log("images updated")
    if (viewRef.current) {
      console.log("listRef is not null2")
    }
  }, [images, initIndex])

  const renderItem = ({ item }: { item: string}) => {
    console.log(`item: ${JSON.stringify(item)}`)
    return ( <Image
        style={styles.image}
        source={item}
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