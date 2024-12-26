import { CirclePlus } from "lucide-react-native";
import { launchImageLibraryAsync } from 'expo-image-picker';

type InsertImageProps = {
  handleMedia: (uri: string) => void
  style?: any
}
export default function InsertMedia({ handleMedia, style }: InsertImageProps ) {
  const handlePress = async () => {
    const result =  await launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
    })
    console.log('mimeType: ', result.assets![0].mimeType)
    handleMedia(result.assets![0].uri!)
  } 
  return (
    <CirclePlus
      onPress={handlePress}
      color={'black'}
      style={ style ? style : {}}
    />
  )
}