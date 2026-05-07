import React, { useCallback } from 'react';
import type { AccessibilityRole, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Tappable wrapper backed by react-native-gesture-handler's Tap gesture
 * (instead of RN Pressable). Use this for any tappable that may be layered
 * over the canvas's pan/pinch — RN's responder Pressable can be cancelled
 * by sibling RNGH gestures, but a Gesture.Tap competes in the same gesture
 * system and reliably fires `onPress`.
 *
 * Provides a small scale + opacity press animation via reanimated.
 */
export function TouchableTap({
  onPress,
  children,
  style,
  pressedScale = 0.97,
  pressedOpacity = 0.86,
  hitSlop = 8,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  pressedOpacity?: number;
  hitSlop?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const fire = useCallback(() => {
    if (!disabled) onPress();
  }, [disabled, onPress]);

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .hitSlop({ vertical: hitSlop, horizontal: hitSlop })
    .maxDuration(800)
    .onTouchesDown(() => {
      'worklet';
      scale.value = withTiming(pressedScale, { duration: 80 });
      opacity.value = withTiming(pressedOpacity, { duration: 80 });
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withTiming(1, { duration: 130 });
      opacity.value = withTiming(1, { duration: 130 });
    })
    .onEnd((_e, success) => {
      'worklet';
      if (success) runOnJS(fire)();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled }}
        style={[style, animStyle]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
