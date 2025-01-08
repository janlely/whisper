import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';


type RecordingProps = {
  style?: any
  className?: string
}

const RecordingIndicator = ({style, className}: RecordingProps) => {
  const waves = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const scaleYValues = waves.map(() => useSharedValue(0));

  React.useEffect(() => {
    scaleYValues.forEach((scaleY, index) => {
      const delay = Math.random() * 1000; // 生成0到1000毫秒之间的随机延迟时间
      scaleY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 500 })
          ),
        -1)
      );
    });
  }, []);

  return (
    <View style={styles.recordingContainer}>
        {
          waves.map((item, idx) => {
            const animatedStyle = useAnimatedStyle(() => ({
              transform: [{ scaleY: scaleYValues[idx].value }],
            }));

            return (
              <Animated.View
                key={item}
                className={className ?? ""}
                style={[styles.wave, animatedStyle]}
              />
            );
          })
        } 
    </View>
  );
};

const styles = StyleSheet.create({
  recordingContainer: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    height: '100%', // 与 Input 的高度一致
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // 可选：背景颜色
    borderRadius: 3, // 可选：圆角
    borderStyle: 'solid', // 可选：边框样式
    borderWidth: 1, // 可选：边框宽度
    borderColor: 'lightgray'
  },
  wave: {
    width: 3,
    height: '70%',
    backgroundColor: 'black',
    marginHorizontal: 5,
    borderRadius: 4,
  },
});

export default RecordingIndicator;
