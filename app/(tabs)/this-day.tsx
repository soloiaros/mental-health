import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { InfiniteCanvas } from '@/components/InfiniteCanvas';
import { Fab } from '@/components/Fab';
import { LogEntrySheet, type LogEntryPayload, type LogEntrySheetHandle } from '@/components/LogEntrySheet';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { useTrackingStore } from '@/store/trackingStore';
import { createId } from '@/utils/id';
import { randomPointInCircle } from '@/utils/random';
import { startOfLocalDayMs } from '@/utils/date';
import { colors, radii, shadows, spacing, text } from '@/theme';

const CONTENT_SIZE = 4000;
const ORIGIN = CONTENT_SIZE / 2;
const BUBBLE = 200; // emotion bubble width
const GIF_W = 200;  // GIF bubble width
const GIF_H = 160;  // GIF bubble height
const CARD_W = 280; // self-respect card width
const CARD_H = 140; // self-respect card height

/** Tiny string→[0..1) hash so rotations/colors are stable per entry id. */
function hashUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [0, 1)
  return ((h >>> 0) % 10000) / 10000;
}

/** -2deg .. +2deg rotation derived from id, gives bubbles an organic tilt. */
function tiltFor(id: string): string {
  const t = hashUnit(id) * 4 - 2;
  return `${t.toFixed(2)}deg`;
}

/** Pick one of the soft accent palettes per emotion-bubble id. */
function emotionPalette(id: string) {
  const u = hashUnit(id + 'palette');
  if (u < 0.34) {
    return { bg: colors.primaryFixed, fg: colors.onPrimaryFixed, dot: colors.primary };
  }
  if (u < 0.67) {
    return { bg: colors.secondaryFixed, fg: colors.onSecondaryFixed, dot: colors.secondary };
  }
  return { bg: colors.errorContainer, fg: colors.onErrorContainer, dot: colors.error };
}

export default function ThisDayScreen() {
  const insets = useSafeAreaInsets();

  const allEmotionLogs = useTrackingStore((s) => s.emotionLogs);
  const allSelfRespectLogs = useTrackingStore((s) => s.selfRespectLogs);

  const todayStart = useMemo(() => startOfLocalDayMs(Date.now()), []);
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  const emotionLogs = useMemo(
    () => allEmotionLogs.filter((l) => l.timestamp >= todayStart && l.timestamp < tomorrowStart),
    [allEmotionLogs, todayStart, tomorrowStart]
  );
  const selfRespectLogs = useMemo(
    () => allSelfRespectLogs.filter((l) => l.timestamp >= todayStart && l.timestamp < tomorrowStart),
    [allSelfRespectLogs, todayStart, tomorrowStart]
  );

  const trackedPoints = useMemo(
    () => [
      ...emotionLogs.map((l) => ({ x: ORIGIN + l.xPos, y: ORIGIN + l.yPos })),
      ...selfRespectLogs.map((l) => ({ x: ORIGIN + l.xPos, y: ORIGIN + l.yPos })),
    ],
    [emotionLogs, selfRespectLogs]
  );

  const addEmotionLog = useTrackingStore((s) => s.addEmotionLog);
  const addSelfRespectLog = useTrackingStore((s) => s.addSelfRespectLog);

  const sheetRef = useRef<LogEntrySheetHandle>(null);

  const onSubmit = useCallback(
    (payload: LogEntryPayload) => {
      const ts = Date.now();
      const { x, y } = randomPointInCircle(220);

      if (payload.kind === 'emotion') {
        addEmotionLog({
          id: createId(),
          timestamp: ts,
          type: payload.type,
          content: payload.content,
          xPos: x,
          yPos: y,
        });
        return;
      }

      addSelfRespectLog({
        id: createId(),
        timestamp: ts,
        description: payload.description,
        xPos: x,
        yPos: y,
      });
    },
    [addEmotionLog, addSelfRespectLog]
  );

  const isEmpty = emotionLogs.length === 0 && selfRespectLogs.length === 0;

  return (
    <View style={styles.screen}>
      <InfiniteCanvas
        contentSize={CONTENT_SIZE}
        minScale={0.5}
        maxScale={3}
        trackedPoints={trackedPoints}
      >
        {/* Soft decorative blobs anchored to the world so they pan with the canvas. */}
        <View style={[styles.blob, styles.blobA, { left: ORIGIN - 320, top: ORIGIN - 360 }]} />
        <View style={[styles.blob, styles.blobB, { left: ORIGIN + 60, top: ORIGIN + 80 }]} />

        {emotionLogs.map((l) => {
          const palette = emotionPalette(l.id);

          if (l.type === 'media_uri' && l.content) {
            return (
              <View
                key={l.id}
                style={[
                  styles.gifBubble,
                  {
                    left: ORIGIN + l.xPos - GIF_W / 2,
                    top: ORIGIN + l.yPos - GIF_H / 2,
                    transform: [{ rotate: tiltFor(l.id) }],
                  },
                ]}
              >
                <Image
                  source={{ uri: l.content }}
                  style={styles.gifImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </View>
            );
          }

          return (
            <View
              key={l.id}
              style={[
                styles.emotionBubble,
                {
                  left: ORIGIN + l.xPos - BUBBLE / 2,
                  top: ORIGIN + l.yPos - 60,
                  backgroundColor: palette.bg,
                  transform: [{ rotate: tiltFor(l.id) }],
                },
              ]}
            >
              <View style={[styles.emotionDot, { backgroundColor: palette.dot }]} />
              <Text numberOfLines={4} style={[styles.emotionText, { color: palette.fg }]}>
                {l.content}
              </Text>
            </View>
          );
        })}

        {selfRespectLogs.map((l) => (
          <View
            key={l.id}
            style={[
              styles.respectCard,
              {
                left: ORIGIN + l.xPos - CARD_W / 2,
                top: ORIGIN + l.yPos - CARD_H / 2,
                transform: [{ rotate: tiltFor(l.id + 'r') }],
              },
            ]}
          >
            <View style={styles.respectHeader}>
              <View style={styles.respectIcon}>
                <MaterialIcons name="grade" size={20} color={colors.onTertiaryFixed} />
              </View>
              <View style={styles.respectHeaderText}>
                <Text style={styles.respectOverline}>Self‑Respect Wall</Text>
                <Text style={styles.respectDate}>Recorded today</Text>
              </View>
            </View>
            <Text numberOfLines={3} style={styles.respectQuote}>
              “{l.description}”
            </Text>
          </View>
        ))}

        {isEmpty ? (
          <View style={[styles.emptyHint, { left: ORIGIN - 160, top: ORIGIN - 60 }]}>
            <Text style={styles.emptyTitle}>A blank canvas, just for today.</Text>
            <Text style={styles.emptyBody}>Tap the + button to drop your first feeling or boundary.</Text>
          </View>
        ) : null}
      </InfiniteCanvas>

      <TopAppBar
        title="The Canvas"
        onLeftPress={() => router.push('/(tabs)/this-day')}
        onRightPress={() => router.push('/profile')}
      />

      <Fab
        accessibilityLabel="Add a new entry"
        onPress={() => sheetRef.current?.open()}
        style={[styles.fab, { bottom: 96 + insets.bottom }]}
      />

      <LogEntrySheet ref={sheetRef} onSubmit={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fab: {
    position: 'absolute',
    right: spacing.gutter,
  },
  // ---- Decorative blobs on canvas ----
  blob: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 200,
    opacity: 0.45,
  },
  blobA: {
    backgroundColor: colors.primaryFixedDim,
  },
  blobB: {
    backgroundColor: colors.secondaryFixedDim,
  },
  // ---- GIF bubble ----
  gifBubble: {
    position: 'absolute',
    width: GIF_W,
    height: GIF_H,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.pop,
  },
  gifImage: {
    width: GIF_W,
    height: GIF_H,
  },
  // ---- Emotion bubble (lavender / soft accent) ----
  emotionBubble: {
    position: 'absolute',
    maxWidth: BUBBLE,
    minWidth: 140,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xxl,
    borderBottomLeftRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    ...shadows.raised,
  },
  emotionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  emotionText: {
    flexShrink: 1,
    ...text.bodyMd,
    fontSize: 15,
    lineHeight: 22,
  },
  // ---- Self-respect card (gold-bordered) ----
  respectCard: {
    position: 'absolute',
    width: CARD_W,
    minHeight: CARD_H,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.pop,
  },
  respectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  respectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  respectHeaderText: {
    flex: 1,
  },
  respectOverline: {
    ...text.labelOverline,
    color: colors.tertiary,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  respectDate: {
    ...text.labelSm,
    fontSize: 12,
    marginTop: 1,
  },
  respectQuote: {
    ...text.h3,
    fontSize: 18,
    lineHeight: 24,
    color: colors.onSurface,
  },
  // ---- Empty hint ----
  emptyHint: {
    position: 'absolute',
    width: 320,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(253, 247, 255, 0.9)',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  emptyTitle: {
    ...text.h3,
    fontSize: 18,
    color: colors.primary,
  },
  emptyBody: {
    ...text.bodyMd,
    marginTop: spacing.xs,
    color: colors.onSurfaceVariant,
  },
});
