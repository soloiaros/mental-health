import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, shadows } from '@/theme';
import { TouchableTap } from './TouchableTap';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * Circular icon button with a soft neumorphic raised surface.
 * If `onPress` is omitted it renders as a static decorative chip.
 */
export function IconButton({
  icon,
  onPress,
  size = 40,
  iconSize,
  iconColor = colors.primary,
  backgroundColor = colors.surfaceContainer,
  style,
  accessibilityLabel,
  raised = true,
}: {
  icon: MaterialIconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  raised?: boolean;
}) {
  const innerStyle = [
    styles.base,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor,
    },
    raised && shadows.raisedSm,
    style,
  ];

  const content = (
    <View style={innerStyle}>
      <MaterialIcons name={icon} size={iconSize ?? Math.round(size * 0.5)} color={iconColor} />
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableTap onPress={onPress} accessibilityLabel={accessibilityLabel}>
      {content}
    </TouchableTap>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
