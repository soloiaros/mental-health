import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { InfiniteCanvas } from '@/components/InfiniteCanvas';
import { useTrackingStore } from '@/store/trackingStore';

function startOfLocalDayMs(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const CONTENT_SIZE = 4000;
const ORIGIN = CONTENT_SIZE / 2;

export default function ThisDayScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // IMPORTANT: select raw arrays only (stable snapshots), then filter via useMemo.
  // Filtering inside the selector creates a new array each snapshot, which can trigger
  // React's "getSnapshot should be cached" warning and lead to update-depth loops.
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

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <InfiniteCanvas contentSize={CONTENT_SIZE} minScale={0.5} maxScale={3}>
        {/* Emotions */}
        {emotionLogs.map((l) => (
          <View
            key={l.id}
            style={[
              styles.emotionBubble,
              {
                left: ORIGIN + l.xPos - BUBBLE / 2,
                top: ORIGIN + l.yPos - BUBBLE / 2,
              },
            ]}
          >
            <Text numberOfLines={2} style={styles.emotionText}>
              {l.content}
            </Text>
          </View>
        ))}

        {/* Self-respect actions */}
        {selfRespectLogs.map((l) => (
          <View
            key={l.id}
            style={[
              styles.respectCard,
              {
                left: ORIGIN + l.xPos - CARD_W / 2,
                top: ORIGIN + l.yPos - CARD_H / 2,
              },
            ]}
          >
            <Text numberOfLines={3} style={styles.respectText}>
              {l.description}
            </Text>
          </View>
        ))}

        {emotionLogs.length === 0 && selfRespectLogs.length === 0 ? (
          <View style={[styles.emptyHint, { left: ORIGIN - 140, top: ORIGIN - 32 }]}>
            <Text style={styles.emptyHintTitle}>No logs for today yet</Text>
            <Text style={styles.emptyHintSubtitle}>Phase 3 adds the FAB + bottom sheet input.</Text>
          </View>
        ) : null}
      </InfiniteCanvas>
    </View>
  );
}

const BUBBLE = 88;
const CARD_W = 220;
const CARD_H = 90;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  emotionBubble: {
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
  emotionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  respectCard: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    backgroundColor: '#C9A227',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  respectText: {
    color: '#1B1200',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyHint: {
    position: 'absolute',
    width: 280,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emptyHintTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyHintSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
});

