import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  clamp,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadows, spacing, text as textStyles } from '@/theme';

type Size = { width: number; height: number };
type Point = { x: number; y: number };

export type InfiniteCanvasProps = PropsWithChildren<{
  /**
   * A large logical surface so absolute-positioned children have "room".
   * We still treat it as "infinite" by not clamping pan.
   */
  contentSize?: number;
  minScale?: number;
  maxScale?: number;
  /**
   * If true, double-tap will reset view to centered + scale=1.
   */
  enableDoubleTapReset?: boolean;
  /**
   * Points (in content-frame coords; i.e. already include any ORIGIN offset)
   * that the canvas should track for off-screen detection. When provided and
   * ALL of them leave the visible viewport, an animated "Recenter" pill fades
   * in at the top of the canvas. Tapping it animates the camera so all the
   * tracked points fit nicely in view again.
   */
  trackedPoints?: Point[];
  /**
   * Screen-space padding (px) used when fitting tracked points on recenter.
   */
  recenterPadding?: number;
  /**
   * Extra top offset (px) for the Recenter pill, on top of the safe-area
   * top inset. Useful to clear a top app bar / floating segmented control.
   */
  recenterTopOffset?: number;
}>;

/** iOS-style rubber-band: smoothly resists going past [min, max], asymptote at ±range. */
function rubberClamp(val: number, min: number, max: number, range = 0.45): number {
  'worklet';
  if (val < min) {
    const d = min - val;
    return min - (range * d) / (range + d);
  }
  if (val > max) {
    const d = val - max;
    return max + (range * d) / (range + d);
  }
  return val;
}

export function InfiniteCanvas({
  children,
  contentSize = 4000,
  minScale = 0.5,
  maxScale = 3,
  enableDoubleTapReset = true,
  trackedPoints,
  recenterPadding = 80,
  recenterTopOffset = 70,
}: InfiniteCanvasProps) {
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const lastViewportRef = useRef<Size>({ width: 0, height: 0 });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);
  const lastFocalX = useSharedValue(0);
  const lastFocalY = useSharedValue(0);

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

  // Animate camera to fit `points` (content-frame coords) into the viewport.
  const fitToPoints = useCallback(
    (points: Point[]) => {
      const vp = lastViewportRef.current;
      if (!vp.width || !vp.height || !points || points.length === 0) return;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      const cx = (minX + maxX) / 2; // centre of the bounding box in content space
      const cy = (minY + maxY) / 2;

      const availW = Math.max(1, vp.width - recenterPadding * 2);
      const availH = Math.max(1, vp.height - recenterPadding * 2);

      // Don't zoom in too aggressively for tight clusters or single items.
      const fit = Math.min(availW / w, availH / h);
      const cap = points.length === 1 ? 1.2 : 1.0;
      const targetScale = Math.max(minScale, Math.min(maxScale, Math.min(fit, cap)));

      // RN applies the scale transform around the VIEW's centre (contentSize/2),
      // not the origin. The screen position of content point px is therefore:
      //   screen_x = contentSize/2 + translateX + (px - contentSize/2) * scale
      //
      // Solving for translateX so that screen_x(cx) = vp.width/2:
      //   targetTX = vp.width/2 - contentSize/2 - (cx - contentSize/2) * targetScale
      const half = contentSize / 2;
      const targetTX = vp.width / 2 - half - (cx - half) * targetScale;
      const targetTY = vp.height / 2 - half - (cy - half) * targetScale;

      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);

      const easing = Easing.bezier(0.22, 0.61, 0.36, 1);
      const duration = 420;
      translateX.value = withTiming(targetTX, { duration, easing });
      translateY.value = withTiming(targetTY, { duration, easing });
      scale.value = withTiming(targetScale, { duration, easing });
    },
    [contentSize, maxScale, minScale, recenterPadding, scale, translateX, translateY]
  );

  const gestures = useMemo(() => {
    const pan = Gesture.Pan()
      // Prevent the pan gesture from stealing simple taps (e.g., the FAB overlay).
      .minDistance(8)
      // Critical: allow taps/presses to be handled by overlay UI.
      .cancelsTouchesInView(false)
      // Stop any in-flight inertia the moment the user touches the canvas again.
      .onTouchesDown(() => {
        cancelAnimation(translateX);
        cancelAnimation(translateY);
      })
      .onBegin(() => {
        panStartX.value = translateX.value;
        panStartY.value = translateY.value;
      })
      .onUpdate((e) => {
        translateX.value = panStartX.value + e.translationX;
        translateY.value = panStartY.value + e.translationY;
      })
      .onEnd((e) => {
        // Velocity-based glide so the canvas keeps moving briefly after release.
        translateX.value = withDecay({ velocity: e.velocityX, deceleration: 0.992 });
        translateY.value = withDecay({ velocity: e.velocityY, deceleration: 0.992 });
      });

    const pinch = Gesture.Pinch()
      .cancelsTouchesInView(false)
      .onTouchesDown(() => {
        cancelAnimation(scale);
        cancelAnimation(translateX);
        cancelAnimation(translateY);
      })
      .onBegin(() => {
        pinchStartScale.value = scale.value;
      })
      .onUpdate((e) => {
        const raw = pinchStartScale.value * e.scale;
        // Rubber-band past [minScale, maxScale] for a softer feel; on end we spring back.
        const nextScale = rubberClamp(raw, minScale, maxScale, 0.45);

        // Zoom around the gesture focal point (screen coords).
        // Derivation:
        //   screen = translate + world * scale
        // Keep the "world point under focal" stable while scale changes.
        const currentScale = scale.value;
        const scaleFactor = nextScale / (currentScale || 1);

        const fx = e.focalX;
        const fy = e.focalY;
        lastFocalX.value = fx;
        lastFocalY.value = fy;

        translateX.value = fx - (fx - translateX.value) * scaleFactor;
        translateY.value = fy - (fy - translateY.value) * scaleFactor;
        scale.value = nextScale;
      })
      .onEnd(() => {
        const currentScale = scale.value;
        const targetScale = clamp(currentScale, minScale, maxScale);
        if (targetScale === currentScale) return;
        // We rubber-banded past the bounds — spring back, keeping the focal point anchored.
        const fx = lastFocalX.value;
        const fy = lastFocalY.value;
        const sf = targetScale / (currentScale || 1);
        const targetTX = fx - (fx - translateX.value) * sf;
        const targetTY = fy - (fy - translateY.value) * sf;
        const cfg = { damping: 22, stiffness: 220, mass: 0.7 };
        scale.value = withSpring(targetScale, cfg);
        translateX.value = withSpring(targetTX, cfg);
        translateY.value = withSpring(targetTY, cfg);
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .cancelsTouchesInView(false)
      .onEnd(() => {
        if (!enableDoubleTapReset) return;
        const vp = viewport;
        if (!vp.width || !vp.height) return;
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scale);
        const easing = Easing.bezier(0.22, 0.61, 0.36, 1);
        translateX.value = withTiming(vp.width / 2 - contentSize / 2, { duration: 280, easing });
        translateY.value = withTiming(vp.height / 2 - contentSize / 2, { duration: 280, easing });
        scale.value = withTiming(1, { duration: 280, easing });
      });

    // Allow pan + pinch simultaneously; double-tap works independently.
    return Gesture.Simultaneous(pan, pinch, doubleTap);
  }, [
    contentSize,
    enableDoubleTapReset,
    lastFocalX,
    lastFocalY,
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

  // ---- Recenter pill: track whether all points have left the viewport ------
  const [showRecenter, setShowRecenter] = useState(false);
  const recenterOpacity = useSharedValue(0);
  const recenterTranslateY = useSharedValue(-12);

  useAnimatedReaction(
    () => {
      const points = trackedPoints;
      const vp = viewport;
      if (!points || points.length === 0) return false;
      if (!vp.width || !vp.height) return false;

      const tx = translateX.value;
      const ty = translateY.value;
      const sc = scale.value;
      // Half-size of the content surface, needed to account for RN's scale-around-centre.
      const half = contentSize / 2;
      // Generous margin so the pill doesn't pop when an item grazes the edge.
      const margin = 36;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        // Correct screen position accounting for scale-around-centre:
        //   screen_x = contentSize/2 + tx + (px - contentSize/2) * scale
        const sx = half + tx + (p.x - half) * sc;
        const sy = half + ty + (p.y - half) * sc;
        if (sx >= -margin && sx <= vp.width + margin && sy >= -margin && sy <= vp.height + margin) {
          return false;
        }
      }
      return true;
    },
    (allOut, prev) => {
      if (allOut !== prev) {
        runOnJS(setShowRecenter)(allOut as boolean);
      }
    },
    [trackedPoints, viewport, contentSize]
  );

  useEffect(() => {
    if (showRecenter) {
      recenterOpacity.value = withTiming(1, { duration: 220 });
      recenterTranslateY.value = withSpring(0, { damping: 16, stiffness: 220, mass: 0.6 });
    } else {
      recenterOpacity.value = withTiming(0, { duration: 180 });
      recenterTranslateY.value = withTiming(-12, { duration: 180 });
    }
  }, [showRecenter, recenterOpacity, recenterTranslateY]);

  const recenterAnimStyle = useAnimatedStyle(() => ({
    opacity: recenterOpacity.value,
    transform: [{ translateY: recenterTranslateY.value }],
  }));

  // Use Gesture.Tap (not Pressable) so this overlay shares the canvas's gesture
  // system and can never be cancelled by the underlying Pan/Pinch.
  const recenterTap = useMemo(
    () =>
      Gesture.Tap()
        .hitSlop({ vertical: 12, horizontal: 12 })
        .maxDuration(800)
        .onEnd((_e, success) => {
          'worklet';
          if (success && trackedPoints && trackedPoints.length > 0) {
            runOnJS(fitToPoints)(trackedPoints);
          }
        }),
    [fitToPoints, trackedPoints]
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      <GestureDetector gesture={gestures}>
        <Animated.View style={[styles.content, { width: contentSize, height: contentSize }, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>

      <Animated.View
        pointerEvents={showRecenter ? 'box-none' : 'none'}
        style={[styles.recenterContainer, { top: insets.top + recenterTopOffset }, recenterAnimStyle]}
      >
        <GestureDetector gesture={recenterTap}>
          <Animated.View
            accessible
            accessibilityRole="button"
            accessibilityLabel="Recenter all entries"
            style={styles.recenterPill}
          >
            <MaterialIcons name="my-location" size={14} color={colors.primary} />
            <Text style={styles.recenterText}>Recenter</Text>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  content: {
    backgroundColor: colors.surface,
  },
  recenterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
  },
  recenterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.pop,
  },
  recenterText: {
    ...textStyles.labelSm,
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
});
