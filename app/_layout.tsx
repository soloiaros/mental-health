// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.surface,
    card: colors.surface,
    text: colors.onSurface,
    border: colors.outlineVariant,
    primary: colors.primary,
    notification: colors.tertiary,
  },
};

const LOGO = require('@/assets/images/logo.png');
// Duration the logo is fully visible before the fade starts.
const HOLD_MS = 1000;
// Duration of the fade-out animation.
const FADE_MS = 350;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  const [splashDone, setSplashDone] = useState(false);
  const opacity = useSharedValue(1);
  // Guard against the timer firing after unmount (e.g. fast-refresh).
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    // Hide the native splash immediately — our in-app screen takes over.
    SplashScreen.hideAsync().catch(() => {});

    const hold = setTimeout(() => {
      if (!mounted.current) return;
      opacity.value = withTiming(0, { duration: FADE_MS }, (finished) => {
        if (finished) runOnJS(setSplashDone)(true);
      });
    }, HOLD_MS);

    return () => clearTimeout(hold);
  }, [fontsLoaded, opacity]);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Render nothing until fonts are ready (native splash is still showing).
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={navTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="profile"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>

      {/* In-app loading screen — sits on top of navigation, fades out after 1 s */}
      {!splashDone && (
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.splash, splashStyle]} pointerEvents="none">
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  splash: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
