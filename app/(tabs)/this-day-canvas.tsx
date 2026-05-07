import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { InfiniteCanvas } from '@/components/InfiniteCanvas';
import { Fab } from '@/components/Fab';
import { LogEntrySheet, type LogEntryPayload, type LogEntrySheetHandle } from '@/components/LogEntrySheet';
import { useTrackingStore } from '@/store/trackingStore';
import { createId } from '@/utils/id';
import { randomPointInCircle } from '@/utils/random';

function startOfLocalDayMs(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const CONTENT_SIZE = 4000;
const ORIGIN = CONTENT_SIZE / 2;
const BUBBLE = 88;
const CARD_W = 220;
const CARD_H = 90;

type EntryMode = 'emotion' | 'selfRespect';

export default function ThisDayCanvasScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const params = useLocalSearchParams<{ mode?: EntryMode; open?: string }>();
  const entryMode: EntryMode = params.mode === 'selfRespect' ? 'selfRespect' : 'emotion';
  const shouldAutoOpen = params.open === '1';

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

  // Points (in canvas content-frame coords) that the canvas should track for
  // off-screen detection / "Recenter" pill behavior.
  const trackedPoints = useMemo(() => {
    const list = entryMode === 'emotion' ? emotionLogs : selfRespectLogs;
    return list.map((l) => ({ x: ORIGIN + l.xPos, y: ORIGIN + l.yPos }));
  }, [entryMode, emotionLogs, selfRespectLogs]);

  const addEmotionLog = useTrackingStore((s) => s.addEmotionLog);
  const addSelfRespectLog = useTrackingStore((s) => s.addSelfRespectLog);

  const sheetRef = useRef<LogEntrySheetHandle>(null);

  const onSubmit = useCallback(
    (payload: LogEntryPayload) => {
      const ts = Date.now();
      const { x, y } = randomPointInCircle(220);

      if (entryMode === 'emotion' && payload.kind !== 'emotion') return;
      if (entryMode === 'selfRespect' && payload.kind !== 'selfRespect') return;

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
    [addEmotionLog, addSelfRespectLog, entryMode]
  );

  // Auto-open sheet when arriving from the hub.
  useEffect(() => {
    if (!shouldAutoOpen) return;
    const t = setTimeout(() => {
      sheetRef.current?.open();
    }, 250);
    return () => clearTimeout(t);
  }, [shouldAutoOpen]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <InfiniteCanvas
        contentSize={CONTENT_SIZE}
        minScale={0.5}
        maxScale={3}
        trackedPoints={trackedPoints}
      >
        {entryMode === 'emotion'
          ? emotionLogs.map((l) => (
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
            ))
          : selfRespectLogs.map((l) => (
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

        {(entryMode === 'emotion' ? emotionLogs.length === 0 : selfRespectLogs.length === 0) ? (
          <View style={[styles.emptyHint, { left: ORIGIN - 140, top: ORIGIN - 32 }]}>
            <Text style={styles.emptyHintTitle}>
              {entryMode === 'emotion' ? 'No emotions logged today yet' : 'No self-respect wins logged today yet'}
            </Text>
            <Text style={styles.emptyHintSubtitle}>Tap + to add your first entry.</Text>
          </View>
        ) : null}
      </InfiniteCanvas>

      <Fab
        accessibilityLabel="Add log"
        icon="add"
        onPress={() => sheetRef.current?.open()}
        style={styles.fab}
      />

      <LogEntrySheet ref={sheetRef} onSubmit={onSubmit} lockedMode={entryMode} initialMode={entryMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    zIndex: 999,
    elevation: 8,
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



