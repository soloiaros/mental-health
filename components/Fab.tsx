import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii, shadows } from '@/theme';

export function Fab({
  onPress,
  style,
  icon = 'add',
  accessibilityLabel,
}: {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const fire = useCallback(() => onPress(), [onPress]);

  // Using a gesture-handler Tap (instead of RN Pressable) so this button
  // shares the same gesture system as the InfiniteCanvas underneath. RN's
  // responder-based Pressable would race with the canvas's Pan/Pinch and
  // get its onPress cancelled, even though pressed feedback still fires.
  const tap = Gesture.Tap()
    .hitSlop({ vertical: 16, horizontal: 16 })
    .maxDuration(800)
    .onTouchesDown(() => {
      'worklet';
      scale.value = withTiming(0.94, { duration: 80 });
      opacity.value = withTiming(0.92, { duration: 80 });
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
        <MaterialIcons name={icon} size={26} color={colors.primary} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.pop,
  },
});
