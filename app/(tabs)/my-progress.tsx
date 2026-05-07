import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { InfiniteCanvas } from '@/components/InfiniteCanvas';
import { TopAppBar, TOP_APP_BAR_HEIGHT } from '@/components/ui/TopAppBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTrackingStore } from '@/store/trackingStore';
import {
  formatLocalDayHeading,
  formatLocalTime,
  localDayKey,
  startOfLocalDayMs,
} from '@/utils/date';
import { colors, radii, shadows, spacing, text } from '@/theme';

type Mode = 'chaos' | 'timeline';

type TimelineItem =
  | { kind: 'emotion'; id: string; timestamp: number; content: string; isGif: boolean }
  | { kind: 'selfRespect'; id: string; timestamp: number; description: string };

type TimelineSection = {
  key: string;
  title: string;
  isToday: boolean;
  data: TimelineItem[];
};

const CONTENT_SIZE = 4500;
const ORIGIN = CONTENT_SIZE / 2;
const BUBBLE = 110;

export default function MyProgressScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('chaos');

  const emotionLogs = useTrackingStore((s) => s.emotionLogs);
  const selfRespectLogs = useTrackingStore((s) => s.selfRespectLogs);

  const chaosTrackedPoints = useMemo(
    () => emotionLogs.map((e) => ({ x: ORIGIN + e.xPos, y: ORIGIN + e.yPos })),
    [emotionLogs]
  );

  const sections = useMemo<TimelineSection[]>(() => {
    const map = new Map<string, TimelineItem[]>();
    const todayKey = localDayKey(startOfLocalDayMs(Date.now()));

    for (const e of emotionLogs) {
      const key = localDayKey(e.timestamp);
      const list = map.get(key) ?? [];
      list.push({ kind: 'emotion', id: e.id, timestamp: e.timestamp, content: e.content, isGif: e.type === 'media_uri' });
      map.set(key, list);
    }
    for (const s of selfRespectLogs) {
      const key = localDayKey(s.timestamp);
      const list = map.get(key) ?? [];
      list.push({ kind: 'selfRespect', id: s.id, timestamp: s.timestamp, description: s.description });
      map.set(key, list);
    }

    // Newest day first; within a day, newest entry first.
    const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    return keys.map((key) => {
      const items = (map.get(key) ?? []).slice().sort((a, b) => b.timestamp - a.timestamp);
      const dayMs = new Date(key + 'T00:00:00').getTime();
      return { key, title: formatLocalDayHeading(dayMs), isToday: key === todayKey, data: items };
    });
  }, [emotionLogs, selfRespectLogs]);

  const screenTopPad = insets.top + TOP_APP_BAR_HEIGHT + spacing.md;

  return (
    <View style={styles.screen}>
      {mode === 'chaos' ? (
        <InfiniteCanvas
          contentSize={CONTENT_SIZE}
          minScale={0.45}
          maxScale={3}
          enableDoubleTapReset
          trackedPoints={chaosTrackedPoints}
          recenterTopOffset={130}
        >
          {emotionLogs.length === 0 ? (
            <View style={[styles.chaosEmpty, { left: ORIGIN - 160, top: ORIGIN - 60 }]}>
              <Text style={styles.chaosEmptyTitle}>The cluster grows here</Text>
              <Text style={styles.chaosEmptyBody}>
                As you log feelings on This Day, they’ll drift in and form your chaos blob.
              </Text>
            </View>
          ) : (
            emotionLogs.map((e, idx) => (
              <ChaosBubble
                key={e.id}
                delayMs={(idx % 14) * 18}
                left={ORIGIN + e.xPos - BUBBLE / 2}
                top={ORIGIN + e.yPos - BUBBLE / 2}
                text={e.type === 'media_uri' ? null : e.content}
                gifUrl={e.type === 'media_uri' ? e.content : undefined}
              />
            ))
          )}
        </InfiniteCanvas>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.timelineContent,
            { paddingTop: screenTopPad + 70, paddingBottom: 140 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {sections.length === 0 ? (
            <View style={styles.timelineEmpty}>
              <Text style={styles.timelineEmptyTitle}>No history yet</Text>
              <Text style={styles.timelineEmptySub}>
                Your emotions and self‑respect wins will appear here, gathered by day.
              </Text>
            </View>
          ) : (
            <View style={styles.timelineWrap}>
              <LinearGradient
                colors={[colors.primaryFixed, 'rgba(203, 196, 210, 0.3)', 'transparent']}
                locations={[0, 0.6, 1]}
                style={styles.timelineLine}
              />
              {sections.map((section, sIdx) => (
                <View key={section.key} style={[styles.section, !section.isToday && styles.sectionDim]}>
                  <DateHeader title={section.title} active={section.isToday} />
                  <View style={styles.sectionBody}>
                    {section.data.map((item) => (
                      <TimelineRow key={`${item.kind}:${item.id}`} item={item} />
                    ))}
                  </View>
                  {sIdx < sections.length - 1 ? <View style={{ height: spacing.lg }} /> : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <TopAppBar
        title="The Canvas"
        onLeftPress={() => router.push('/(tabs)/this-day')}
        onRightPress={() => router.push('/profile')}
      />

      <View style={[styles.toggleFloat, { top: insets.top + TOP_APP_BAR_HEIGHT + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.toggleInner}>
          <SegmentedControl<Mode>
            value={mode}
            options={[
              { value: 'chaos', label: 'Chaos Blob' },
              { value: 'timeline', label: 'Timeline' },
            ]}
            onChange={setMode}
          />
        </View>
      </View>
    </View>
  );
}

function DateHeader({ title, active }: { title: string; active: boolean }) {
  return (
    <View style={styles.dateHeaderRow}>
      <View style={[styles.dateDot, !active && styles.dateDotDim]} />
      <Text style={[styles.dateHeaderText, !active && styles.dateHeaderTextDim]}>{title}</Text>
    </View>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  if (item.kind === 'selfRespect') {
    return (
      <View style={styles.rowWrap}>
        <View style={[styles.rowDot, styles.rowDotGold]} />
        <BoundaryCard description={item.description} timestamp={item.timestamp} />
      </View>
    );
  }
  return (
    <View style={styles.rowWrap}>
      <View style={styles.rowDot} />
      <EmotionPill content={item.content} timestamp={item.timestamp} isGif={item.isGif} />
    </View>
  );
}

function BoundaryCard({ description, timestamp }: { description: string; timestamp: number }) {
  return (
    <View style={styles.boundaryCard}>
      <View style={styles.boundaryDecorBlob} />
      <View style={styles.boundaryHeader}>
        <View style={styles.boundaryIconWrap}>
          <MaterialIcons name="shield" size={20} color={colors.onTertiaryFixed} />
        </View>
        <View style={styles.boundaryHeaderText}>
          <Text style={styles.boundaryOverline}>Boundary Established</Text>
          <Text style={styles.boundaryDescription} numberOfLines={6}>
            {description}
          </Text>
        </View>
      </View>
      <Text style={styles.boundaryTime}>{formatLocalTime(timestamp)}</Text>
    </View>
  );
}

function EmotionPill({ content, timestamp, isGif }: { content: string; timestamp: number; isGif: boolean }) {
  if (isGif && content) {
    return (
      <View style={styles.timelineGifWrap}>
        <Image
          source={{ uri: content }}
          style={styles.timelineGif}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <Text style={styles.emotionTime}>{formatLocalTime(timestamp)}</Text>
      </View>
    );
  }

  const isLong = content.length > 90;
  if (isLong) {
    return (
      <View style={styles.organicCard}>
        <View style={styles.organicShape}>
          <MaterialIcons name="cloud" size={22} color={colors.onSurfaceVariant} />
        </View>
        <View style={styles.organicBody}>
          <Text style={styles.organicQuote}>“{content}”</Text>
          <Text style={styles.organicMeta}>{formatLocalTime(timestamp)} • Journal entry</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.emotionRow}>
      <View style={styles.emotionPill}>
        <View style={styles.emotionPillDot} />
        <Text numberOfLines={2} style={styles.emotionPillText}>
          {content}
        </Text>
      </View>
      <Text style={styles.emotionTime}>{formatLocalTime(timestamp)}</Text>
    </View>
  );
}

function ChaosBubble({
  left,
  top,
  text: bubbleText,
  gifUrl,
  delayMs,
}: {
  left: number;
  top: number;
  text: string | null;
  gifUrl?: string;
  delayMs: number;
}) {
  const s = useSharedValue(0.92);
  const y = useSharedValue(-6);

  React.useEffect(() => {
    s.value = withDelay(delayMs, withSpring(1, { damping: 12, stiffness: 180, mass: 0.7 }));
    y.value = withDelay(delayMs, withSpring(0, { damping: 14, stiffness: 220, mass: 0.7 }));
  }, [delayMs, s, y]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: s.value }],
  }));

  if (gifUrl) {
    return (
      <Animated.View style={[styles.chaosGifBubble, { left, top }, anim]}>
        <Image source={{ uri: gifUrl }} style={styles.chaosGifImage} contentFit="cover" cachePolicy="memory-disk" />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.chaosBubble, { left, top }, anim]}>
      <Text numberOfLines={3} style={styles.chaosBubbleText}>
        {bubbleText}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // ---- Floating Chaos/Timeline toggle ----
  toggleFloat: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  toggleInner: {
    width: 280,
  },
  // ---- Chaos empty state ----
  chaosEmpty: {
    position: 'absolute',
    width: 320,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(253, 247, 255, 0.9)',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chaosEmptyTitle: {
    ...text.h3,
    fontSize: 18,
    color: colors.primary,
  },
  chaosEmptyBody: {
    ...text.bodyMd,
    marginTop: spacing.xs,
    color: colors.onSurfaceVariant,
  },
  chaosBubble: {
    position: 'absolute',
    width: BUBBLE,
    minHeight: 60,
    borderRadius: radii.xxl,
    borderBottomLeftRadius: radii.md,
    backgroundColor: colors.primaryFixed,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    justifyContent: 'center',
    ...shadows.raisedSm,
  },
  chaosGifBubble: {
    position: 'absolute',
    width: BUBBLE,
    height: 80,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.raisedSm,
  },
  chaosGifImage: {
    width: BUBBLE,
    height: 80,
  },
  chaosBubbleText: {
    ...text.bodyMd,
    color: colors.onPrimaryFixed,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  // ---- Timeline list ----
  timelineContent: {
    paddingHorizontal: spacing.gutter,
  },
  timelineWrap: {
    position: 'relative',
    paddingLeft: 32,
    paddingRight: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 24,
    top: 6,
    bottom: 24,
    width: 2,
    borderRadius: 999,
  },
  section: {
    marginBottom: spacing.gutter,
  },
  sectionDim: {
    opacity: 0.7,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  dateDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.primaryFixedDim,
    marginLeft: -16,
    marginRight: spacing.md,
  },
  dateDotDim: {
    borderColor: colors.outlineVariant,
  },
  dateHeaderText: {
    ...text.h2,
    fontSize: 24,
    color: colors.onSurface,
  },
  dateHeaderTextDim: {
    color: colors.onSurfaceVariant,
  },
  sectionBody: {
    gap: spacing.sm,
    marginLeft: 4,
  },
  rowWrap: {
    position: 'relative',
    paddingLeft: spacing.sm,
  },
  rowDot: {
    position: 'absolute',
    left: -14,
    top: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryFixedDim,
    borderWidth: 2,
    borderColor: colors.surface,
    zIndex: 2,
  },
  rowDotGold: {
    backgroundColor: colors.tertiaryFixedDim,
    width: 12,
    height: 12,
    borderRadius: 6,
    left: -15,
    top: 18,
  },
  // ---- Boundary (gold) card ----
  boundaryCard: {
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radii.xl,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.raisedSm,
  },
  boundaryDecorBlob: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.tertiaryFixedDim,
    opacity: 0.45,
  },
  boundaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  boundaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 247, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundaryHeaderText: {
    flex: 1,
  },
  boundaryOverline: {
    ...text.labelOverline,
    color: colors.onTertiaryFixed,
    opacity: 0.75,
    marginBottom: 4,
  },
  boundaryDescription: {
    ...text.bodyMd,
    color: colors.onTertiaryFixed,
    fontSize: 16,
    lineHeight: 22,
  },
  boundaryTime: {
    ...text.labelSm,
    color: colors.onTertiaryFixed,
    opacity: 0.7,
    marginTop: spacing.unit,
    marginLeft: 48,
  },
  // ---- Emotion pill row ----
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit,
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  emotionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.primaryFixed,
    maxWidth: '88%',
    ...shadows.raisedSm,
  },
  emotionPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emotionPillText: {
    ...text.bodyMd,
    color: colors.onPrimaryFixed,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flexShrink: 1,
  },
  emotionTime: {
    ...text.labelSm,
    color: colors.outline,
    fontSize: 12,
  },
  // ---- Timeline GIF entry ----
  timelineGifWrap: {
    gap: spacing.unit,
  },
  timelineGif: {
    width: '100%',
    height: 140,
    borderRadius: radii.lg,
    ...shadows.raisedSm,
  },
  // ---- Organic emotion (long content) card ----
  organicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    padding: spacing.md,
    ...shadows.raisedSm,
  },
  organicShape: {
    width: 56,
    height: 56,
    borderRadius: 22,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  organicBody: {
    flex: 1,
  },
  organicQuote: {
    ...text.bodyLg,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurface,
  },
  organicMeta: {
    ...text.labelSm,
    color: colors.outline,
    marginTop: spacing.unit,
  },
  // ---- Timeline empty state ----
  timelineEmpty: {
    paddingTop: 40,
    alignItems: 'center',
  },
  timelineEmptyTitle: {
    ...text.h2,
    fontSize: 22,
    color: colors.onSurface,
  },
  timelineEmptySub: {
    ...text.bodyMd,
    marginTop: spacing.sm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
