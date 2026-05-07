import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Size = { width: number; height: number };

export type InfiniteCanvasProps = PropsWithChildren<{
  /**
   * A large logical surface so absolute-positioned children have “room”.
   * We still treat it as “infinite” by not clamping pan.
   */
  contentSize?: number;
  minScale?: number;
  maxScale?: number;
  /**
   * If true, double-tap will reset view to centered + scale=1.
   */
  enableDoubleTapReset?: boolean;
}>;

export function InfiniteCanvas({
  children,
  contentSize = 4000,
  minScale = 0.5,
  maxScale = 3,
  enableDoubleTapReset = true,
}: InfiniteCanvasProps) {
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const lastViewportRef = useRef<Size>({ width: 0, height: 0 });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);

  const centerContentInView = useCallback(
    (vp: Size) => {
      // Center the large content surface so (0,0) is in the middle of the screen.
      // We treat the content's origin as its top-left; "world origin" is content center.
      translateX.value = vp.width / 2 - contentSize / 2;
      translateY.value = vp.height / 2 - contentSize / 2;
      scale.value = 1;
    },
    [contentSize, scale, translateX, translateY]
  );

  const onLayout = useCallback(
    (e: any) => {
      const { width, height } = e.nativeEvent.layout as Size;
      const last = lastViewportRef.current;
      if (last.width === width && last.height === height) return;
      lastViewportRef.current = { width, height };

      setViewport({ width, height });
      centerContentInView({ width, height });
    },
    [centerContentInView]
  );

  const gestures = useMemo(() => {
    const pan = Gesture.Pan()
      // Prevent the pan gesture from stealing simple taps (e.g., the FAB overlay).
      .minDistance(8)
      .onBegin(() => {
        panStartX.value = translateX.value;
        panStartY.value = translateY.value;
      })
      .onUpdate((e) => {
        translateX.value = panStartX.value + e.translationX;
        translateY.value = panStartY.value + e.translationY;
      });

    const pinch = Gesture.Pinch()
      .onBegin(() => {
        pinchStartScale.value = scale.value;
      })
      .onUpdate((e) => {
        const nextScale = clamp(pinchStartScale.value * e.scale, minScale, maxScale);

        // Zoom around the gesture focal point (screen coords).
        // Derivation:
        //   screen = translate + world * scale
        // Keep the "world point under focal" stable while scale changes.
        const currentScale = scale.value;
        const scaleFactor = nextScale / (currentScale || 1);

        const fx = e.focalX;
        const fy = e.focalY;

        translateX.value = fx - (fx - translateX.value) * scaleFactor;
        translateY.value = fy - (fy - translateY.value) * scaleFactor;
        scale.value = nextScale;
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd(() => {
        if (!enableDoubleTapReset) return;
        const vp = viewport;
        if (!vp.width || !vp.height) return;
        // Go back to centered default with a tiny animation.
        translateX.value = withTiming(vp.width / 2 - contentSize / 2, { duration: 180 });
        translateY.value = withTiming(vp.height / 2 - contentSize / 2, { duration: 180 });
        scale.value = withTiming(1, { duration: 180 });
      });

    // Allow pan + pinch simultaneously; double-tap works independently.
    return Gesture.Simultaneous(pan, pinch, doubleTap);
  }, [
    contentSize,
    enableDoubleTapReset,
    maxScale,
    minScale,
    panStartX,
    panStartY,
    pinchStartScale,
    scale,
    translateX,
    translateY,
    viewport,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <View style={styles.container} onLayout={onLayout}>
      <GestureDetector gesture={gestures}>
        <Animated.View style={[styles.content, { width: contentSize, height: contentSize }, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    backgroundColor: '#0B0B0C',
  },
});

