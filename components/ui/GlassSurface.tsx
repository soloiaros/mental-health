import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { colors } from '@/theme';

/**
 * Translucent blurred surface — the visual primitive behind the top app bar,
 * the bottom nav, and the input bottom sheet. Falls back to a tinted opaque
 * surface on Android API levels where BlurView's experimental implementation
 * is too expensive.
 */
export function GlassSurface({
  intensity = 60,
  tint = 'light',
  style,
  children,
}: {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidFallback, style]}>
        <View style={StyleSheet.absoluteFillObject}>
          <BlurView
            intensity={Math.min(intensity, 40)}
            tint={tint}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={[styles.base, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(253, 247, 255, 0.55)',
    overflow: 'hidden',
  },
  androidFallback: {
    backgroundColor: colors.surface + 'E6',
    overflow: 'hidden',
  },
});
