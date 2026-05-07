import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radii, shadows, spacing, text } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { TouchableTap } from './TouchableTap';

const APPBAR_CONTENT_HEIGHT = 56;

/**
 * Floating top app bar with a glass background. Left slot is a "leaf"
 * brand button (decorative or pressable), right slot is a circular
 * avatar/profile entry point.
 */
export function TopAppBar({
  title = 'The Canvas',
  onLeftPress,
  onRightPress,
  rightAccessibilityLabel = 'Open profile',
}: {
  title?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <GlassSurface intensity={70} tint="light" style={[styles.bar, { paddingTop: insets.top, height: insets.top + APPBAR_CONTENT_HEIGHT }]}>
      <View style={styles.row}>
        <BrandButton onPress={onLeftPress} />
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <AvatarButton onPress={onRightPress} accessibilityLabel={rightAccessibilityLabel} />
      </View>
    </GlassSurface>
  );
}

function BrandButton({ onPress }: { onPress?: () => void }) {
  const inner = (
    <View style={styles.brand}>
      <MaterialIcons name="spa" size={20} color={colors.primary} />
    </View>
  );
  if (!onPress) return inner;
  return (
    <TouchableTap onPress={onPress} accessibilityLabel="App home">
      {inner}
    </TouchableTap>
  );
}

function AvatarButton({
  onPress,
  accessibilityLabel,
}: {
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const inner = (
    <View style={styles.avatar}>
      <MaterialIcons name="person" size={20} color={colors.onSecondaryContainer} />
    </View>
  );
  if (!onPress) return inner;
  return (
    <TouchableTap onPress={onPress} accessibilityLabel={accessibilityLabel}>
      {inner}
    </TouchableTap>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(31, 22, 53, 0.06)',
  },
  row: {
    flex: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raisedSm,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.unit,
  },
  title: {
    ...text.h3,
    fontSize: 19,
    color: colors.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceVariant,
  },
});

/** Total reserved space the TopAppBar occupies under the safe-area top inset. */
export const TOP_APP_BAR_HEIGHT = APPBAR_CONTENT_HEIGHT;
