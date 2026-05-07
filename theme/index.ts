/**
 * Design tokens for "The Canvas" app.
 *
 * Mirrors the Material 3 expressive lavender palette + neumorphic spacing
 * scale that drives the marketing/HTML mocks. Components should always read
 * tokens from here instead of hardcoding hex/sizes.
 */

import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Surfaces
  surface: '#FDF7FF',
  surfaceBright: '#FDF7FF',
  surfaceDim: '#DED8E0',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8F2FA',
  surfaceContainer: '#F2ECF4',
  surfaceContainerHigh: '#ECE6EE',
  surfaceContainerHighest: '#E6E0E9',
  surfaceVariant: '#E6E0E9',

  // Foreground / text
  onSurface: '#1D1B20',
  onSurfaceVariant: '#494551',
  outline: '#7A7582',
  outlineVariant: '#CBC4D2',

  // Primary (deep lavender)
  primary: '#4F378A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#6750A4',
  onPrimaryContainer: '#E0D2FF',
  primaryFixed: '#E9DDFF',
  primaryFixedDim: '#CFBCFF',
  onPrimaryFixed: '#22005D',
  onPrimaryFixedVariant: '#4F378A',

  // Secondary (muted slate-violet)
  secondary: '#63597C',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E1D4FD',
  onSecondaryContainer: '#645A7D',
  secondaryFixed: '#E9DDFF',
  secondaryFixedDim: '#CDC0E9',
  onSecondaryFixed: '#1F1635',
  onSecondaryFixedVariant: '#4B4263',

  // Tertiary (gold — used for self-respect/boundary actions)
  tertiary: '#765B00',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#C9A74D',
  onTertiaryContainer: '#503D00',
  tertiaryFixed: '#FFDF93',
  tertiaryFixedDim: '#E7C365',
  onTertiaryFixed: '#241A00',
  onTertiaryFixedVariant: '#594400',

  // Errors / warm accents
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',

  // Inverse
  inverseSurface: '#322F35',
  inverseOnSurface: '#F5EFF7',
  inversePrimary: '#CFBCFF',
} as const;

export const spacing = {
  xs: 4,
  unit: 8,
  sm: 12,
  md: 24,
  gutter: 24,
  margin: 32,
  lg: 48,
  xl: 80,
  nav: 72,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const fonts = {
  display: 'PlusJakartaSans_700Bold',
  displaySemi: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
} as const;

/** Pre-baked text styles aligned with the design's typographic scale. */
export const text = {
  h1: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: colors.onSurface,
  },
  h2: {
    fontFamily: fonts.displaySemi,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.onSurface,
  },
  h3: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    lineHeight: 28,
    color: colors.onSurface,
  },
  bodyLg: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 26,
    color: colors.onSurface,
  },
  bodyMd: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
  },
  labelSm: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.onSurfaceVariant,
  },
  labelOverline: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: colors.onSurfaceVariant,
  },
} as const satisfies Record<string, TextStyle>;

/**
 * Soft neumorphic raised shadow.
 * RN can render only a single shadow per view, so this approximates the
 * "light + dark" neumorphic look with a soft warm-dark drop shadow.
 */
export const shadows = {
  raised: {
    shadowColor: '#1F1635',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  raisedSm: {
    shadowColor: '#1F1635',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pop: {
    shadowColor: '#1F1635',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;
