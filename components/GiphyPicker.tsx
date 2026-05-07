import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

import { GIPHY_API_KEY } from '@/config/giphy';
import { type GiphyGif, fetchTrending, searchGifs } from '@/services/giphyApi';
import { colors, radii, shadows, spacing, text } from '@/theme';
import { TouchableTap } from '@/components/ui/TouchableTap';

export type GiphyPickerHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  onSelect: (gif: GiphyGif) => void;
};

const COLUMN_GAP = spacing.unit;
const GRID_PADDING = spacing.gutter;

export const GiphyPicker = forwardRef<GiphyPickerHandle, Props>(function GiphyPicker(
  { onSelect },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%', '96%'], []);

  useImperativeHandle(ref, () => ({
    open: () => modalRef.current?.present(),
    close: () => modalRef.current?.dismiss(),
  }), []);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search query by 400 ms.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const results = debouncedQuery.trim()
          ? await searchGifs(debouncedQuery)
          : await fetchTrending();
        if (!cancelled) setGifs(results);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (gif: GiphyGif) => {
      onSelect(gif);
      modalRef.current?.dismiss();
    },
    [onSelect]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    ),
    []
  );

  const noKey = GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY_HERE' || !GIPHY_API_KEY;

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Find a GIF</Text>
          <Text style={styles.subtitle}>Powered by Giphy</Text>
        </View>

        {noKey ? (
          <ApiKeyWarning />
        ) : (
          <>
            <SearchBar value={query} onChange={setQuery} />

            {loading ? (
              <View style={styles.centred}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.centred}>
                <MaterialIcons name="wifi-off" size={36} color={colors.outline} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : gifs.length === 0 ? (
              <View style={styles.centred}>
                <Text style={styles.emptyText}>{'No GIFs found for "' + debouncedQuery + '"'}</Text>
              </View>
            ) : (
              <GifGrid gifs={gifs} onSelect={handleSelect} />
            )}
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.searchWrap}>
      <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search feelings, moods, reactions…"
        placeholderTextColor={colors.outline}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.searchInput}
      />
      {value.length > 0 ? (
        <TouchableTap onPress={() => onChange('')} accessibilityLabel="Clear search" hitSlop={12}>
          <MaterialIcons name="close" size={18} color={colors.outline} />
        </TouchableTap>
      ) : null}
    </View>
  );
}

function GifGrid({ gifs, onSelect }: { gifs: GiphyGif[]; onSelect: (g: GiphyGif) => void }) {
  const renderItem = useCallback(
    ({ item }: { item: GiphyGif }) => <GifTile gif={item} onSelect={onSelect} />,
    [onSelect]
  );

  const keyExtractor = useCallback((item: GiphyGif) => item.id, []);

  return (
    <FlatList
      data={gifs}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.gridContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      windowSize={5}
    />
  );
}

function GifTile({ gif, onSelect }: { gif: GiphyGif; onSelect: (g: GiphyGif) => void }) {
  const tileWidth = 160;
  const tileHeight = Math.round(tileWidth / (gif.aspectRatio || 1));

  return (
    <TouchableTap
      onPress={() => onSelect(gif)}
      accessibilityLabel={gif.title || 'GIF'}
      style={styles.tile}
      pressedOpacity={0.7}
      pressedScale={0.96}
    >
      <Image
        source={{ uri: gif.previewUrl }}
        style={[styles.tileImage, { width: tileWidth, height: Math.max(80, Math.min(200, tileHeight)) }]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={160}
      />
    </TouchableTap>
  );
}

function ApiKeyWarning() {
  return (
    <View style={styles.warningCard}>
      <MaterialIcons name="vpn-key" size={32} color={colors.tertiary} />
      <Text style={styles.warningTitle}>Giphy API key not set</Text>
      <Text style={styles.warningBody}>
        Open <Text style={styles.warningCode}>config/giphy.ts</Text> and replace{' '}
        <Text style={styles.warningCode}>YOUR_GIPHY_API_KEY_HERE</Text> with your key.{'\n\n'}
        Get a free key at{' '}
        <Text style={styles.warningCode}>developers.giphy.com</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: colors.outlineVariant,
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
  },
  container: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  header: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.unit,
  },
  title: {
    ...text.h3,
    fontSize: 20,
    color: colors.onSurface,
  },
  subtitle: {
    ...text.labelSm,
    color: colors.outline,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: GRID_PADDING,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.unit,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    ...text.bodyMd,
    fontSize: 15,
    color: colors.onSurface,
    padding: 0,
  },
  gridContent: {
    paddingHorizontal: GRID_PADDING - COLUMN_GAP / 2,
    paddingBottom: spacing.xl,
    gap: COLUMN_GAP,
  },
  row: {
    gap: COLUMN_GAP,
  },
  tile: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    ...shadows.raisedSm,
  },
  tileImage: {
    borderRadius: radii.md,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  emptyText: {
    ...text.bodyMd,
    color: colors.onSurfaceVariant,
  },
  errorText: {
    ...text.labelSm,
    color: colors.onErrorContainer,
    textAlign: 'center',
    paddingHorizontal: spacing.margin,
  },
  warningCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.margin,
    gap: spacing.sm,
  },
  warningTitle: {
    ...text.h3,
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'center',
  },
  warningBody: {
    ...text.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  warningCode: {
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
});
