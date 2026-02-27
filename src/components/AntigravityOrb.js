import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  SweepGradient,
  vec,
  Blur,
  mix,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width;
const ORB_RADIUS = CANVAS_SIZE * 0.3;
const CENTER = vec(CANVAS_SIZE / 2, CANVAS_SIZE / 2);

export default function AntigravityOrb() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [rotation, pulse]);

  const animatedRadius = useDerivedValue(() => {
    return mix(pulse.value, ORB_RADIUS, ORB_RADIUS * 1.05);
  });

  const animatedBlur = useDerivedValue(() => {
    return mix(pulse.value, 15, 30);
  });

  const transform = useDerivedValue(() => {
    return [{ rotate: rotation.value }];
  });

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Outer Glow */}
        <Circle c={CENTER} r={animatedRadius}>
          <SweepGradient
            c={CENTER}
            colors={['#00ffff', '#0000ff', '#ff00ff', '#ff0000', '#00ffff']}
            transform={transform}
          />
          <Blur blur={animatedBlur} />
        </Circle>
        
        {/* Inner Solid Core */}
        <Circle c={CENTER} r={ORB_RADIUS * 0.8}>
          <SweepGradient
            c={CENTER}
            colors={['#202020', '#101010', '#303030', '#202020']}
            transform={transform}
          />
        </Circle>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  },
});
