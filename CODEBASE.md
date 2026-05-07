# MentalHealth MVP – Codebase Map (Phase 1)

## Local “DB” (on-device persistence)

This MVP uses **Zustand** as the in-memory state layer and **Zustand persist** to save/load state from local device storage.

- **Primary storage**: `react-native-mmkv` (fast native key/value store)
- **Fallback storage**: `@react-native-async-storage/async-storage`
- **Persist key**: `tracking-store-v1`

### Persisted schema (v1)

Stored under the single key `tracking-store-v1` as JSON:

- **`emotionLogs: EmotionLog[]`**
  - `id: string`
  - `timestamp: number` (ms since epoch)
  - `type: 'text' | 'emoji' | 'media_uri'`
  - `content: string`
  - `xPos: number`
  - `yPos: number`
- **`selfRespectLogs: SelfRespectLog[]`**
  - `id: string`
  - `timestamp: number` (ms since epoch)
  - `description: string`
  - `xPos: number`
  - `yPos: number`

## Navigation (Expo Router Tabs)

Bottom tabs live under `app/(tabs)/`:

- **`This Day`**: `app/(tabs)/this-day.tsx`
- **`My Progress`**: `app/(tabs)/my-progress.tsx`
- **`Profile`**: `app/(tabs)/profile.tsx`

`app/(tabs)/index.tsx` exists only to **redirect** to `This Day` (and is hidden from the tab bar).

Within `This Day`:

- **Hub screen**: `app/(tabs)/this-day.tsx` (entry point with 2 feature cards)
- **Canvas + input (hidden route)**: `app/(tabs)/this-day-canvas.tsx` (infinite canvas + FAB + bottom sheet)
  - Hidden from bottom tabs via `app/(tabs)/_layout.tsx` (`href: null`)
  - Used in two locked “spaces”:
    - Emotion Canvas: `mode=emotion` (renders + creates only `EmotionLog`)
    - Self-Respect Wall: `mode=selfRespect` (renders + creates only `SelfRespectLog`)

## Key files (what each is for)

- **`app/_layout.tsx`**: Root router stack + theme provider; mounts the `(tabs)` group.
- **`app/(tabs)/_layout.tsx`**: Bottom tab configuration (titles + icons + initial route).
- **`store/trackingStore.ts`**: Zustand store + types (`EmotionLog`, `SelfRespectLog`) + actions + persistence wiring.
- **`store/persistStorage.ts`**: Storage adapter used by Zustand persist (MMKV-first, AsyncStorage fallback; web-safe).
- **`components/InfiniteCanvas.tsx`**: Reanimated + Gesture Handler “infinite” pan/zoom surface for plotting logs by `(xPos,yPos)`.
- **`components/LogEntrySheet.tsx`**: Bottom sheet modal for adding Emotion/Self-Respect logs (Phase 3 input UI).
- **`components/Fab.tsx`**: Floating action button used to open the log sheet.
- **`utils/random.ts`**: Random spawn point helpers (logs appear near center).
- **`utils/id.ts`**: ID generator (UUID when available, fallback otherwise).
- **`babel.config.js`**: Enables `react-native-reanimated/plugin` (required for stable Reanimated behavior).

