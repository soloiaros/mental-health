/**
 * GiphyPicker — inline search + grid component.
 *
 * Renders a search bar and a scrollable 2-column GIF grid with no modal
 * wrapping. Embed it directly inside whatever container you need
 * (e.g. inside a BottomSheetScrollView when the entry sheet is in GIF mode).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

import { GIPHY_API_KEY } from '@/config/giphy';
import { type GiphyGif, fetchTrending, searchGifs } from '@/services/giphyApi';
import { colors, radii, shadows, spacing, text } from '@/theme';
import { TouchableTap } from '@/components/ui/TouchableTap';

export type { GiphyGif };

const COLUMN_GAP = spacing.unit;

type Props = {
  onSelect: (gif: GiphyGif) => void;
};

export function GiphyPicker({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 400 ms debounce on the search input.
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

  const noKey =
    !(GIPHY_API_KEY as string) || (GIPHY_API_KEY as string) === 'YOUR_GIPHY_API_KEY_HERE';

  if (noKey) {
    return <ApiKeyWarning />;
  }

  return (
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.outline} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search feelings, moods, reactions…"
          placeholderTextColor={colors.outline}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableTap onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={12}>
            <MaterialIcons name="close" size={18} color={colors.outline} />
          </TouchableTap>
        )}
      </View>

      {/* Label */}
      <Text style={styles.gridLabel}>
        {debouncedQuery.trim() ? `Results for "${debouncedQuery}"` : 'Trending'}
      </Text>

      {/* Grid / states */}
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
          <Text style={styles.emptyText}>
            {'No GIFs found for "' + debouncedQuery + '"'}
          </Text>
        </View>
      ) : (
        <GifGrid gifs={gifs} onSelect={onSelect} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Internal pieces
// ---------------------------------------------------------------------------

function GifGrid({ gifs, onSelect }: { gifs: GiphyGif[]; onSelect: (g: GiphyGif) => void }) {
  const renderItem = useCallback(
    ({ item }: { item: GiphyGif }) => <GifTile gif={item} onSelect={onSelect} />,
    [onSelect]
  );

  return (
    <FlatList
      data={gifs}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.gridContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      windowSize={5}
      // Disable FlatList's own scroll so the parent BottomSheet scrolls.
      scrollEnabled={false}
    />
  );
}

function GifTile({ gif, onSelect }: { gif: GiphyGif; onSelect: (g: GiphyGif) => void }) {
  const tileH = Math.max(80, Math.min(180, Math.round(150 / (gif.aspectRatio || 1))));

  return (
    <TouchableTap
      onPress={() => onSelect(gif)}
      accessibilityLabel={gif.title || 'GIF'}
      style={[styles.tile, { height: tileH }]}
      pressedOpacity={0.65}
      pressedScale={0.96}
    >
      <Image
        source={{ uri: gif.previewUrl }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
    </TouchableTap>
  );
}

function ApiKeyWarning() {
  return (
    <View style={styles.centred}>
      <MaterialIcons name="vpn-key" size={32} color={colors.tertiary} />
      <Text style={styles.warningTitle}>Giphy API key not set</Text>
      <Text style={styles.warningBody}>
        {'Open '}
        <Text style={styles.warningCode}>config/giphy.ts</Text>
        {' and replace '}
        <Text style={styles.warningCode}>YOUR_GIPHY_API_KEY_HERE</Text>
        {' with your key from developers.giphy.com'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.unit,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.unit,
    marginBottom: spacing.unit,
  },
  searchInput: {
    flex: 1,
    ...text.bodyMd,
    fontSize: 15,
    color: colors.onSurface,
    padding: 0,
  },
  gridLabel: {
    ...text.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.unit,
  },
  gridContent: {
    gap: COLUMN_GAP,
    paddingBottom: spacing.lg,
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
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
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
  warningTitle: {
    ...text.h3,
    fontSize: 17,
    color: colors.onSurface,
    textAlign: 'center',
  },
  warningBody: {
    ...text.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  warningCode: {
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
  },
});
