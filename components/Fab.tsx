import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function Fab({
  onPress,
  style,
  icon = 'add',
  accessibilityLabel,
}: {
  onPress: () => void;
  style?: ViewStyle;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const fire = useCallback(() => {
    onPress();
  }, [onPress]);

  // Using a gesture-handler Tap (instead of RN Pressable) so this button
  // shares the same gesture system as the InfiniteCanvas underneath.
  // RN's responder-based Pressable would race with the canvas's Pan/Pinch
  // and get its onPress cancelled, even though pressed feedback still fires.
  const tap = Gesture.Tap()
    .hitSlop({ vertical: 16, horizontal: 16 })
    .maxDuration(800)
    .onTouchesDown(() => {
      'worklet';
      scale.value = withTiming(0.95, { duration: 80 });
      opacity.value = withTiming(0.9, { duration: 80 });
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withTiming(1, { duration: 120 });
      opacity.value = withTiming(1, { duration: 120 });
    })
    .onEnd((_e, success) => {
      'worklet';
      if (success) runOnJS(fire)();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Add'}
        style={[styles.base, style, animStyle]}
      >
        <Ionicons name={icon} size={24} color="#0B0B0C" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
