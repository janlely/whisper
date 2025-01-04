import { StyleSheet } from "react-native"
import Svg, { Circle, ClipPath, Defs, G, Polygon, Rect } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

type AudioAnimatedIconProps = {
  playing?: boolean,
  size: number,
  rotate?: number 
}
export default function AudioAnimatedIcon(props: AudioAnimatedIconProps) {
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(1);
  const opacity3 = useSharedValue(1);


  useEffect(() => {
    if (props.playing) {
      opacity1.value = 0;
      opacity2.value = 0;
      opacity3.value = 0;
      animateCircles();
    } else {
      opacity1.value = 1;
      opacity2.value = 1;
      opacity3.value = 1;
    }
  }, [props.playing]);

  // 定义动画序列
  const animateCircles = () => {
    opacity1.value = withRepeat(withSequence(
      withTiming(1, { duration: 500 }), // 圆1显示
      withDelay(1000, withTiming(0, { duration: 500 })),
    ), -1, true);

    opacity2.value = withRepeat(withSequence(
      withDelay(500, withTiming(1, { duration: 500 })),
      withDelay(500, withTiming(0, { duration: 500 })),
    ), -1, true);

    opacity3.value = withRepeat(withSequence(
      withDelay(1000, withTiming(1, { duration: 500 })),
      withTiming(0, { duration: 500 }),
    ), -1, true);
  };
  const circle1Style = useAnimatedStyle(() => ({
    opacity: opacity1.value,
  }));

  const circle2Style = useAnimatedStyle(() => ({
    opacity: opacity2.value,
  }));

  const circle3Style = useAnimatedStyle(() => ({
    opacity: opacity3.value,
  }));

  // 当组件挂载或 `playing` 属性变化时启动动画
  return (
    <Svg
      height={props.size}
      width={props.size}
      viewBox="0 0 100 100"
      rotation={props.rotate ?? 0}
    >
      <Defs>
        <ClipPath id="myClipPath">
          <Polygon points="50,50 100,20 100,80 50,50" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#myClipPath)">
        <Rect x={0} y={0} width={100} height={100} fill='white' />
        <AnimatedCircle animatedProps={circle3Style} id='circle3' cx={50} cy={50} r={45} strokeWidth={10} stroke={'black'} fill='none' />
        <AnimatedCircle animatedProps={circle2Style} id='circle2' cx={50} cy={50} r={30} strokeWidth={10} stroke={'black'} fill='none' />
        <AnimatedCircle animatedProps={circle1Style} id='circle1' cx={50} cy={50} r={20} fill='black' />
        <ClipPath id="clip">
          <Polygon points='50,50, 100,20, 100,80, 50,50' />
        </ClipPath>
      </G>
    </Svg>
  )
}
