import { GIPHY_API_KEY, GIPHY_BASE_URL } from '@/config/giphy';

export type GiphyImage = {
  url: string;
  width: string;
  height: string;
};

export type GiphyGif = {
  id: string;
  title: string;
  /** The URL we store and later display on the canvas (fixed_height downsized). */
  displayUrl: string;
  /** Small preview for the picker grid (fixed_width_small). */
  previewUrl: string;
  /** Original-quality URL kept in case we need it. */
  originalUrl: string;
  /** Aspect ratio (width / height) of the display image. */
  aspectRatio: number;
};

type GiphyRawGif = {
  id: string;
  title: string;
  images: {
    fixed_height: { url: string; width: string; height: string };
    fixed_width_small: { url: string; width: string; height: string };
    original: { url: string; width: string; height: string };
  };
};

function parseGif(raw: GiphyRawGif): GiphyGif {
  const display = raw.images.fixed_height;
  const preview = raw.images.fixed_width_small;
  const original = raw.images.original;
  const w = parseFloat(display.width) || 1;
  const h = parseFloat(display.height) || 1;
  return {
    id: raw.id,
    title: raw.title ?? '',
    displayUrl: display.url,
    previewUrl: preview.url,
    originalUrl: original.url,
    aspectRatio: w / h,
  };
}

function buildUrl(path: string, params: Record<string, string | number>): string {
  const query = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString();
  return `${GIPHY_BASE_URL}${path}?${query}`;
}

/** Fetch trending GIFs. */
export async function fetchTrending(limit = 24): Promise<GiphyGif[]> {
  const url = buildUrl('/trending', { limit, rating: 'g' });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Giphy trending failed: ${res.status}`);
  const json = await res.json();
  return (json.data as GiphyRawGif[]).map(parseGif);
}

/** Search GIFs by keyword. */
export async function searchGifs(query: string, limit = 24, offset = 0): Promise<GiphyGif[]> {
  if (!query.trim()) return fetchTrending(limit);
  const url = buildUrl('/search', { q: query.trim(), limit, offset, rating: 'g' });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Giphy search failed: ${res.status}`);
  const json = await res.json();
  return (json.data as GiphyRawGif[]).map(parseGif);
}
