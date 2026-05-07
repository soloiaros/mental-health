import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { colors, radii, spacing, text } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { TouchableTap } from './TouchableTap';

type IconMap = Record<string, React.ComponentProps<typeof MaterialIcons>['name']>;

const TAB_ICONS: IconMap = {
  'this-day': 'bubble-chart',
  'my-progress': 'timeline',
};

const TAB_TITLES: Record<string, string> = {
  'this-day': 'This Day',
  'my-progress': 'Progress',
};

/**
 * Custom bottom tab bar with a translucent glass background, rounded top
 * corners, and a pill-shaped active state. Hides any tab routes whose
 * `href` is set to `null` (so we can keep e.g. the profile screen
 * navigable while keeping it out of the bar).
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((r) => {
    // Routes that have set `href: null` in their options should be hidden.
    const route = state.routes.find((rr) => rr.key === r.key);
    if (!route) return false;
    // We can't reliably read href from here, so rely on TAB_TITLES whitelist.
    return TAB_TITLES[r.name] !== undefined;
  });

  return (
    <GlassSurface
      intensity={70}
      tint="light"
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm,
        },
      ]}
    >
      <View style={styles.row}>
        {visibleRoutes.map((route) => {
          const isFocused = state.routes[state.index].key === route.key;
          const iconName = TAB_ICONS[route.name] ?? 'circle';
          const label = TAB_TITLES[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              // Using a typed navigate call here is brittle across versions
              // of react-navigation; tab routes never need typed params, so
              // we cast to bypass the strict generic.
              (navigation as unknown as { navigate: (name: string) => void }).navigate(
                route.name
              );
            }
          };

          return (
            <TouchableTap
              key={route.key}
              onPress={onPress}
              accessibilityLabel={`${label} tab`}
              style={styles.tab}
              pressedScale={0.95}
            >
              <View style={[styles.tabInner, isFocused && styles.tabInnerActive]}>
                <MaterialIcons
                  name={iconName}
                  size={22}
                  color={isFocused ? colors.primary : colors.onSurfaceVariant}
                />
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {label}
                </Text>
              </View>
            </TouchableTap>
          );
        })}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(31, 22, 53, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#1F1635',
        shadowOpacity: 0.06,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
  },
  tab: {
    flex: 0,
  },
  tabInner: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    gap: 2,
  },
  tabInnerActive: {
    backgroundColor: 'rgba(79, 55, 138, 0.10)',
    transform: [{ scale: 0.95 }],
  },
  tabLabel: {
    ...text.labelSm,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
});
