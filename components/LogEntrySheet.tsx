import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import type { EmotionLogType } from '@/store/trackingStore';
import { colors, radii, shadows, spacing, text } from '@/theme';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TouchableTap } from '@/components/ui/TouchableTap';
import { GiphyPicker } from '@/components/GiphyPicker';
import type { GiphyGif } from '@/services/giphyApi';

export type LogEntrySheetHandle = {
  open: () => void;
  close: () => void;
};

export type LogEntryPayload =
  | { kind: 'emotion'; type: EmotionLogType; content: string }
  | { kind: 'selfRespect'; description: string };

type Mode = 'emotion' | 'selfRespect';

export const LogEntrySheet = forwardRef<
  LogEntrySheetHandle,
  {
    onSubmit: (payload: LogEntryPayload) => void;
    initialMode?: Mode;
  }
>(function LogEntrySheet({ onSubmit, initialMode = 'emotion' }, ref) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [emotionType, setEmotionType] = useState<EmotionLogType>('text');
  const [emotionContent, setEmotionContent] = useState('');
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [respectDescription, setRespectDescription] = useState('');

  const modalRef = useRef<BottomSheetModal>(null);

  // Snap indices:
  //   0 → 60 %  (text / emoji / selected-gif view)
  //   1 → 96 %  (gif search + grid)
  const snapPoints = useMemo(() => ['60%', '96%'], []);

  React.useImperativeHandle(
    ref,
    () => ({
      open: () => {
        modalRef.current?.present();
        // Always start at the compact snap point.
        modalRef.current?.snapToIndex(0);
      },
      close: () => modalRef.current?.dismiss(),
    }),
    []
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    []
  );

  const reset = useCallback(() => {
    setEmotionContent('');
    setSelectedGif(null);
    setRespectDescription('');
    setEmotionType('text');
    setMode('emotion');
  }, []);

  // Switch to GIF mode: expand the sheet so the grid has room.
  const enterGifMode = useCallback(() => {
    setEmotionType('media_uri');
    setSelectedGif(null);
    setEmotionContent('');
    requestAnimationFrame(() => {
      modalRef.current?.snapToIndex(1);
    });
  }, []);

  const handleGifSelect = useCallback((gif: GiphyGif) => {
    setSelectedGif(gif);
    setEmotionContent(gif.displayUrl);
    // Collapse back to the compact view now that a GIF is chosen.
    modalRef.current?.snapToIndex(0);
  }, []);

  const clearGif = useCallback(() => {
    setSelectedGif(null);
    setEmotionContent('');
  }, []);

  const submit = useCallback(() => {
    if (mode === 'emotion') {
      const content = emotionType === 'media_uri'
        ? (selectedGif?.displayUrl ?? '').trim()
        : emotionContent.trim();
      if (!content) return;
      onSubmit({ kind: 'emotion', type: emotionType, content });
    } else {
      const description = respectDescription.trim();
      if (!description) return;
      onSubmit({ kind: 'selfRespect', description });
    }
    reset();
    modalRef.current?.dismiss();
  }, [emotionContent, emotionType, mode, onSubmit, reset, respectDescription, selectedGif]);

  const isEmotion = mode === 'emotion';
  const isGif = emotionType === 'media_uri';
  // Show the full-height gif search pane when gif mode is on and nothing is picked yet.
  const showGifSearch = isEmotion && isGif && selectedGif === null;

  const submitDisabled = isEmotion
    ? isGif
      ? selectedGif === null
      : emotionContent.trim().length === 0
    : respectDescription.trim().length === 0;

  // ------------------------------------------------------------------
  // When gif search pane is open we need a scrollable container so the
  // grid can extend beyond the sheet height. Switch to BottomSheetScrollView.
  // ------------------------------------------------------------------
  const sharedHeader = (
    <>
      <Text style={styles.title}>
        {isEmotion ? 'How are you feeling right now?' : 'What boundary did you honor?'}
      </Text>

      {/* Input area */}
      {isEmotion && isGif ? (
        selectedGif ? (
          <GifPreview gif={selectedGif} onChangePress={enterGifMode} onClear={clearGif} />
        ) : null /* grid is shown below in scroll mode */
      ) : (
        <View style={styles.inputWrap}>
          {isEmotion ? (
            <TextInput
              value={emotionContent}
              onChangeText={setEmotionContent}
              placeholder={emotionType === 'emoji' ? 'Type or paste an emoji…' : 'Write what surfaces…'}
              placeholderTextColor={colors.outline}
              style={styles.input}
              multiline
              autoCorrect
              maxLength={500}
            />
          ) : (
            <TextInput
              value={respectDescription}
              onChangeText={setRespectDescription}
              placeholder="Example: I declined an extra project to protect my evening."
              placeholderTextColor={colors.outline}
              style={styles.input}
              multiline
              autoCorrect
              maxLength={500}
            />
          )}
        </View>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Categorize entry</Text>
        <SegmentedControl<Mode>
          value={mode}
          options={[
            { value: 'emotion', label: 'Emotion' },
            { value: 'selfRespect', label: 'Action' },
          ]}
          onChange={(next) => {
            setMode(next);
            if (isGif) {
              // Leave gif mode when switching to action
              setEmotionType('text');
              setSelectedGif(null);
              setEmotionContent('');
            }
          }}
          style={styles.toggle}
        />
      </View>

      {isEmotion ? (
        <View style={styles.bottomBar}>
          <View style={styles.toolRow}>
            <ToolButton icon="edit-note" accessibilityLabel="Text" active={emotionType === 'text'} onPress={() => setEmotionType('text')} />
            <ToolButton icon="mood" accessibilityLabel="Emoji" active={emotionType === 'emoji'} onPress={() => setEmotionType('emoji')} />
            <ToolButton icon="gif" accessibilityLabel="Pick a GIF" active={isGif} onPress={enterGifMode} />
          </View>
          <SubmitButton onPress={submit} disabled={submitDisabled} />
        </View>
      ) : (
        <View style={[styles.bottomBar, styles.bottomBarEnd]}>
          <SubmitButton onPress={submit} disabled={submitDisabled} />
        </View>
      )}
    </>
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      handleStyle={styles.handleStyle}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
      onDismiss={reset}
    >
      {showGifSearch ? (
        // Expanded gif-search mode: scrollable so the grid can extend.
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {sharedHeader}

          {/* GIF label + inline picker */}
          <Text style={styles.gifPickerLabel}>Pick a GIF</Text>
          <GiphyPicker onSelect={handleGifSelect} />
        </BottomSheetScrollView>
      ) : (
        // Normal compact mode: fixed layout.
        <BottomSheetView style={styles.container}>
          {sharedHeader}
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GifPreview({
  gif,
  onChangePress,
  onClear,
}: {
  gif: GiphyGif;
  onChangePress: () => void;
  onClear: () => void;
}) {
  const previewH = Math.max(100, Math.min(200, Math.round(160 / (gif.aspectRatio || 1))));

  return (
    <View style={styles.gifPreviewWrap}>
      <Image
        source={{ uri: gif.displayUrl }}
        style={[styles.gifPreview, { height: previewH }]}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.gifPreviewActions}>
        <TouchableTap onPress={onChangePress} accessibilityLabel="Change GIF" style={styles.gifAction}>
          <MaterialIcons name="refresh" size={16} color={colors.primary} />
          <Text style={styles.gifActionText}>Change</Text>
        </TouchableTap>
        <TouchableTap onPress={onClear} accessibilityLabel="Remove GIF" style={styles.gifAction}>
          <MaterialIcons name="close" size={16} color={colors.error} />
          <Text style={[styles.gifActionText, { color: colors.error }]}>Remove</Text>
        </TouchableTap>
      </View>
    </View>
  );
}

function ToolButton({
  icon,
  active,
  onPress,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  active?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableTap onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <View style={[styles.toolBtn, active && styles.toolBtnActive]}>
        <MaterialIcons name={icon} size={20} color={active ? colors.primary : colors.secondary} />
      </View>
    </TouchableTap>
  );
}

function SubmitButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableTap onPress={onPress} disabled={disabled} accessibilityLabel="Add to canvas">
      <View style={[styles.submit, disabled && styles.submitDisabled]}>
        <MaterialIcons name="arrow-upward" size={22} color={colors.onPrimary} />
      </View>
    </TouchableTap>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  handleStyle: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleIndicator: {
    backgroundColor: colors.outlineVariant,
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#1F1635',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 16 },
    }),
  },
  // Compact (non-gif) mode container
  container: {
    flex: 1,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.unit,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  // Scrollable gif-search mode container
  scrollContent: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.unit,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...text.h3,
    fontSize: 22,
    color: colors.onSurface,
  },
  // ---- text / emoji input ----
  inputWrap: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 140,
  },
  input: {
    ...text.bodyLg,
    fontSize: 18,
    lineHeight: 26,
    minHeight: 120,
    color: colors.onSurface,
    textAlignVertical: 'top',
  },
  // ---- GIF preview (after selection) ----
  gifPreviewWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    ...shadows.raisedSm,
  },
  gifPreview: {
    width: '100%',
  },
  gifPreviewActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.unit,
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  gifAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  gifActionText: {
    ...text.labelSm,
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  // ---- GIF search pane label ----
  gifPickerLabel: {
    ...text.labelOverline,
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: -spacing.xs,
  },
  // ---- Mode / categorize row ----
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.unit,
    paddingVertical: spacing.unit,
    gap: spacing.sm,
  },
  toggleLabel: {
    ...text.labelSm,
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },
  toggle: {
    minWidth: 200,
  },
  // ---- Bottom action bar ----
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarEnd: {
    justifyContent: 'flex-end',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.raisedSm,
  },
  toolBtnActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primaryFixedDim,
  },
  submit: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitDisabled: {
    backgroundColor: colors.outline,
    shadowOpacity: 0,
  },
});
