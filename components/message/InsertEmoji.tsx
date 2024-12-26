import { Smile } from "lucide-react-native"
import React from "react"
import { Box } from "../ui/box"
import EmojiPicker, { type EmojiType, EmojiKeyboard } from 'rn-emoji-keyboard'
type InsertEmojiProps = {
  style?: any
  handleEmoji: (text: string) => void
}
export default function InsertEmoji({ handleEmoji, style }: InsertEmojiProps) {

  const [open, setOpen] = React.useState(false)
  const handleEmojiPick = (emoji: EmojiType) => {
    handleEmoji(emoji.emoji)
  }
  return (
    <Box>
      {open &&
        <EmojiKeyboard
          onEmojiSelected={handleEmojiPick}
          allowMultipleSelections={true}
        />
      }
      <Smile
        color={'black'}
        onPress={() => setOpen(!open)}
        style={style ? style : {}}
      />
    </Box>
  )
}