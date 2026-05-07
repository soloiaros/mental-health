import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { InfiniteCanvas } from '@/components/InfiniteCanvas';
import { useTrackingStore } from '@/store/trackingStore';
import { formatLocalDayHeading, formatLocalTime, localDayKey } from '@/utils/date';

type Mode = 'chaos' | 'timeline';

type TimelineItem =
  | {
      kind: 'emotion';
      id: string;
      timestamp: number;
      title: string;
      subtitle: string;
    }
  | {
      kind: 'selfRespect';
      id: string;
      timestamp: number;
      title: string;
      subtitle: string;
    };

type TimelineSection = {
  key: string; // YYYY-MM-DD
  title: string;
  data: TimelineItem[];
};

const CONTENT_SIZE = 4500;
const ORIGIN = CONTENT_SIZE / 2;
const BUBBLE = 82;

export default function MyProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [mode, setMode] = useState<Mode>('chaos');

  const emotionLogs = useTrackingStore((s) => s.emotionLogs);
  const selfRespectLogs = useTrackingStore((s) => s.selfRespectLogs);

  const chaosTrackedPoints = useMemo(
    () => emotionLogs.map((e) => ({ x: ORIGIN + e.xPos, y: ORIGIN + e.yPos })),
    [emotionLogs]
  );

  const sections = useMemo<TimelineSection[]>(() => {
    const map = new Map<string, TimelineItem[]>();

    for (const e of emotionLogs) {
      const key = localDayKey(e.timestamp);
      const list = map.get(key) ?? [];
      list.push({
        kind: 'emotion',
        id: e.id,
        timestamp: e.timestamp,
        title: e.type === 'emoji' ? 'Emotion (emoji)' : e.type === 'media_uri' ? 'Emotion (media)' : 'Emotion',
        subtitle: e.content,
      });
      map.set(key, list);
    }

    for (const s of selfRespectLogs) {
      const key = localDayKey(s.timestamp);
      const list = map.get(key) ?? [];
      list.push({
        kind: 'selfRespect',
        id: s.id,
        timestamp: s.timestamp,
        title: 'Self‑respect',
        subtitle: s.description,
      });
      map.set(key, list);
    }

    // Sort sections newest-first; list will be inverted so newest appears at bottom.
    const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    return keys.map((key) => {
      const items = (map.get(key) ?? []).slice().sort((a, b) => b.timestamp - a.timestamp);
      const dayMs = new Date(key + 'T00:00:00').getTime();
      return { key, title: formatLocalDayHeading(dayMs), data: items };
    });
  }, [emotionLogs, selfRespectLogs]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>My Progress</Text>

        <View style={styles.segment}>
          <SegmentButton
            active={mode === 'chaos'}
            label="Chaos Blob"
            onPress={() => setMode('chaos')}
          />
          <SegmentButton
            active={mode === 'timeline'}
            label="Timeline"
            onPress={() => setMode('timeline')}
          />
        </View>
      </View>

      {mode === 'chaos' ? (
        <InfiniteCanvas
          contentSize={CONTENT_SIZE}
          minScale={0.45}
          maxScale={3}
          enableDoubleTapReset
          trackedPoints={chaosTrackedPoints}
        >
          {emotionLogs.length === 0 ? (
            <View style={[styles.emptyHint, { left: ORIGIN - 150, top: ORIGIN - 32 }]}>
              <Text style={styles.emptyHintTitle}>No emotions logged yet</Text>
              <Text style={styles.emptyHintSubtitle}>Start in “This Day” → Emotion Canvas.</Text>
            </View>
          ) : (
            emotionLogs.map((e, idx) => (
              <ChaosBubble
                key={e.id}
                delayMs={(idx % 14) * 18}
                left={ORIGIN + e.xPos - BUBBLE / 2}
                top={ORIGIN + e.yPos - BUBBLE / 2}
                text={e.content}
              />
            ))
          )}
        </InfiniteCanvas>
      ) : (
        <SectionList
          sections={sections}
          inverted
          stickySectionHeadersEnabled={false}
          keyExtractor={(item) => `${item.kind}:${item.id}`}
          contentContainerStyle={styles.timelineContent}
          renderItem={({ item }) => <TimelineRow item={item} />}
          renderSectionFooter={({ section }) => (
            <View style={[styles.sectionHeaderWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
              <Text style={[styles.sectionHeaderText, { color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.7)' }]}>
                {section.title}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.timelineEmpty}>
              <Text style={[styles.timelineEmptyTitle, { color: isDark ? '#fff' : '#000' }]}>No history yet</Text>
              <Text style={[styles.timelineEmptySub, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                Your emotions and self‑respect wins will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ChaosBubble({
  left,
  top,
  text,
  delayMs,
}: {
  left: number;
  top: number;
  text: string;
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

  return (
    <Animated.View style={[styles.chaosBubble, { left, top }, anim]}>
      <Text numberOfLines={2} style={styles.chaosBubbleText}>
        {text}
      </Text>
    </Animated.View>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View
      style={[
        styles.row,
        item.kind === 'selfRespect' ? styles.rowRespect : styles.rowEmotion,
        isDark && styles.rowDark,
        isDark && item.kind === 'selfRespect' && styles.rowRespectDark,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={item.kind === 'selfRespect' ? 'shield-checkmark' : 'heart'}
          size={16}
          color={item.kind === 'selfRespect' ? (isDark ? '#1B1200' : '#1B1200') : '#fff'}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: isDark ? '#fff' : '#0B0B0C' }]}>{item.title}</Text>
        <Text
          numberOfLines={3}
          style={[styles.rowSubtitle, { color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)' }]}
        >
          {item.subtitle}
        </Text>
      </View>
      <Text style={[styles.rowTime, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }]}>
        {formatLocalTime(item.timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  segment: {
    marginTop: 12,
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.6)',
  },
  segmentBtnTextActive: {
    color: '#0B0B0C',
  },
  chaosBubble: {
    position: 'absolute',
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: '#2D2AFA',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  chaosBubbleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyHint: {
    position: 'absolute',
    width: 300,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emptyHintTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyHintSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeaderWrap: {
    marginTop: 14,
    marginBottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  sectionHeaderText: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 12,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  rowEmotion: {},
  rowRespect: {
    backgroundColor: '#F3E2A6',
  },
  rowDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  rowRespectDark: {
    backgroundColor: '#C9A227',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: '#0B0B0C',
    fontSize: 13,
    fontWeight: '900',
  },
  rowSubtitle: {
    marginTop: 2,
    color: 'rgba(0,0,0,0.65)',
    fontSize: 13,
    fontWeight: '700',
  },
  rowTime: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
    marginTop: 2,
  },
  timelineEmpty: {
    paddingTop: 40,
    alignItems: 'center',
  },
  timelineEmptyTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  timelineEmptySub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 18,
  },
});

