import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import type { EmotionLogType } from '@/store/trackingStore';

export type LogEntrySheetHandle = {
  open: () => void;
  close: () => void;
};

export type LogEntryPayload =
  | { kind: 'emotion'; type: EmotionLogType; content: string }
  | { kind: 'selfRespect'; description: string };

export const LogEntrySheet = forwardRef<
  LogEntrySheetHandle,
  {
    onSubmit: (payload: LogEntryPayload) => void;
    initialMode?: 'emotion' | 'selfRespect';
    /**
     * When provided, the sheet becomes a single-purpose entry surface
     * and the mode toggle is hidden.
     */
    lockedMode?: 'emotion' | 'selfRespect';
  }
>(function LogEntrySheet({ onSubmit, initialMode = 'emotion', lockedMode }, ref) {
  const snapPoints = useMemo(() => ['50%', '80%'], []);
  const [mode, setMode] = useState<'emotion' | 'selfRespect'>(initialMode);
  const [emotionType, setEmotionType] = useState<EmotionLogType>('text');
  const [emotionContent, setEmotionContent] = useState('');
  const [respectDescription, setRespectDescription] = useState('');

  const modalRef = React.useRef<BottomSheetModal>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      open: () => modalRef.current?.present(),
      close: () => modalRef.current?.dismiss(),
    }),
    []
  );

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    []
  );

  const submit = useCallback(() => {
    const effectiveMode = lockedMode ?? mode;

    if (effectiveMode === 'emotion') {
      const content = emotionContent.trim();
      if (!content) return;
      onSubmit({ kind: 'emotion', type: emotionType, content });
      setEmotionContent('');
      modalRef.current?.dismiss();
      return;
    }

    const description = respectDescription.trim();
    if (!description) return;
    onSubmit({ kind: 'selfRespect', description });
    setRespectDescription('');
    modalRef.current?.dismiss();
  }, [emotionContent, emotionType, lockedMode, mode, onSubmit, respectDescription]);

  const effectiveMode = lockedMode ?? mode;

  const primaryDisabled =
    effectiveMode === 'emotion' ? emotionContent.trim().length === 0 : respectDescription.trim().length === 0;

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Log something</Text>

        {!lockedMode ? (
          <View style={styles.segment}>
            <SegmentButton active={mode === 'emotion'} label="Emotion" onPress={() => setMode('emotion')} />
            <SegmentButton
              active={mode === 'selfRespect'}
              label="Boundary / Self-Respect"
              onPress={() => setMode('selfRespect')}
            />
          </View>
        ) : null}

        {effectiveMode === 'emotion' ? (
          <>
            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.pillsRow}>
              <Pill active={emotionType === 'text'} label="Text" onPress={() => setEmotionType('text')} />
              <Pill active={emotionType === 'emoji'} label="Emoji" onPress={() => setEmotionType('emoji')} />
              <Pill active={emotionType === 'media_uri'} label="Meme/GIF URL" onPress={() => setEmotionType('media_uri')} />
            </View>

            <Text style={styles.sectionLabel}>What are you feeling?</Text>
            <TextInput
              value={emotionContent}
              onChangeText={setEmotionContent}
              placeholder={emotionType === 'media_uri' ? 'Paste a GIF/meme URI…' : emotionType === 'emoji' ? 'Type an emoji…' : 'Write freely…'}
              placeholderTextColor="rgba(0,0,0,0.4)"
              style={styles.input}
              multiline
            />
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>What boundary / self-respect action did you take?</Text>
            <TextInput
              value={respectDescription}
              onChangeText={setRespectDescription}
              placeholder="Example: Said no to a draining plan."
              placeholderTextColor="rgba(0,0,0,0.4)"
              style={styles.input}
              multiline
            />
          </>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={submit}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.primaryButton,
            primaryDisabled && styles.primaryButtonDisabled,
            pressed && !primaryDisabled && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Add to canvas</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Pill({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B0B0C',
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
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
  },
  segmentBtnTextActive: {
    color: '#0B0B0C',
  },
  sectionLabel: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.7)',
  },
  pillsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  pillActive: {
    backgroundColor: '#0B0B0C',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.7)',
  },
  pillTextActive: {
    color: '#fff',
  },
  input: {
    marginTop: 8,
    minHeight: 96,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    color: '#0B0B0C',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0B0B0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.35,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});


