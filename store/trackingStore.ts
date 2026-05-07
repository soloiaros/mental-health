import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/store/persistStorage';

export type EmotionLogType = 'text' | 'emoji' | 'media_uri';

export type EmotionLog = {
  id: string;
  timestamp: number;
  type: EmotionLogType;
  content: string;
  xPos: number;
  yPos: number;
};

export type SelfRespectLog = {
  id: string;
  timestamp: number;
  description: string;
  xPos: number;
  yPos: number;
};

type TrackingState = {
  emotionLogs: EmotionLog[];
  selfRespectLogs: SelfRespectLog[];

  addEmotionLog: (log: EmotionLog) => void;
  addSelfRespectLog: (log: SelfRespectLog) => void;

  clearAll: () => void;
};

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set) => ({
      emotionLogs: [],
      selfRespectLogs: [],

      addEmotionLog: (log) =>
        set((s) => ({
          emotionLogs: [...s.emotionLogs, log],
        })),

      addSelfRespectLog: (log) =>
        set((s) => ({
          selfRespectLogs: [...s.selfRespectLogs, log],
        })),

      clearAll: () =>
        set(() => ({
          emotionLogs: [],
          selfRespectLogs: [],
        })),
    }),
    {
      name: 'tracking-store-v1',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      // If we later change schema, we can migrate here.
      migrate: (persistedState) => persistedState as TrackingState,
      partialize: (s) => ({
        emotionLogs: s.emotionLogs,
        selfRespectLogs: s.selfRespectLogs,
      }),
    }
  )
);

