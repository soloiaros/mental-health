import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing, text } from '@/theme';
import { TouchableTap } from './TouchableTap';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

/**
 * Pill-shaped segmented control with an inset track and a raised "thumb"
 * for the active option. Mirrors the Chaos / Timeline + Emotion / Action
 * toggles in the design.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (next: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.track, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableTap
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityLabel={opt.label}
            style={styles.itemWrap}
            pressedScale={0.99}
          >
            <View style={[styles.item, active && styles.itemActive]}>
              <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                {opt.label}
              </Text>
            </View>
          </TouchableTap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    // Faux inset highlight (RN can't do dual shadows; rely on bg contrast).
    borderWidth: 1,
    borderColor: 'rgba(31, 22, 53, 0.04)',
  },
  itemWrap: {
    flex: 1,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.surface,
    ...shadows.raisedSm,
  },
  label: {
    ...text.labelSm,
    fontSize: 13,
  },
  labelActive: {
    color: colors.primary,
  },
  labelInactive: {
    color: colors.onSurfaceVariant,
  },
});
