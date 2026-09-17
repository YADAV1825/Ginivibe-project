import React, { useEffect, ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface Props {
  children?: ReactNode;
}

export default function AnimatedBackground({ children }: Props) {
  const orb1Y = useSharedValue(-100);
  const orb1X = useSharedValue(-50);
  
  const orb2Y = useSharedValue(height - 200);
  const orb2X = useSharedValue(width - 150);

  const orb3Y = useSharedValue(height / 2);
  const orb3X = useSharedValue(-100);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    orb1Y.value = withRepeat(
      withTiming(height / 3, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orb1X.value = withRepeat(
      withTiming(width / 2, { duration: 18000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    orb2Y.value = withRepeat(
      withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orb2X.value = withRepeat(
      withTiming(-100, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    orb3Y.value = withRepeat(
      withTiming(height, { duration: 20000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orb3X.value = withRepeat(
      withTiming(width, { duration: 22000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }, { scale: pulseScale.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }, { scale: pulseScale.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb3X.value }, { translateY: orb3Y.value }, { scale: pulseScale.value }],
  }));

  const tap = Gesture.Tap()
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      pulseScale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    });

  return (
    <GestureDetector gesture={tap}>
      <View style={styles.container}>
        <View style={styles.baseBg} />
        
        <AnimatedGradient
          colors={['rgba(139, 92, 246, 0.5)', 'rgba(217, 70, 239, 0.5)']}
          style={[styles.orb, { width: 350, height: 350, borderRadius: 175 }, orb1Style]}
        />
        <AnimatedGradient
          colors={['rgba(56, 189, 248, 0.45)', 'rgba(59, 130, 246, 0.45)']}
          style={[styles.orb, { width: 450, height: 450, borderRadius: 225 }, orb2Style]}
        />
        <AnimatedGradient
          colors={['rgba(244, 63, 94, 0.35)', 'rgba(236, 72, 153, 0.35)']}
          style={[styles.orb, { width: 300, height: 300, borderRadius: 150 }, orb3Style]}
        />

        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  baseBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#020617',
  },
  orb: {
    position: 'absolute',
  },
});
