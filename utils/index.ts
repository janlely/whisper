import {useImageManipulator} from 'expo-image-manipulator' // Update based on documentation
import * as FileSystem from 'expo-file-system';

export async function resizeImageWithAspectRatio(imageUri: string, width: number, dest: string) {
    const manipulateAsync = useImageManipulator(imageUri);
    const image = await manipulateAsync.resize({
        width: width,
    }).renderAsync();
    const result = await image.saveAsync()
    FileSystem.moveAsync({
        from: result.uri,
        to: dest
    })
}
