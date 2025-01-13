import { useEffect, useRef, useState } from "react"
import { View, StyleSheet } from "react-native"

type Props = {
  getExpire: () => number
}
export function OnlineLight({ getExpire }: Props) {
  const [backgroundColor, setBackgroundColor] = useState('gray')
  const intervalRef = useRef<NodeJS.Timeout| null>(null)

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      setBackgroundColor(getExpire() > Date.now() ? 'green' : 'gray')
    }, 1000)
  }, [])

  return (
    <View style={[styles.container, { backgroundColor:  backgroundColor}]}/>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: '50%'
  }
})