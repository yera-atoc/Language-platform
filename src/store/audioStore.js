import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAudioStore = create(
  persist(
    (set) => ({
      ttsEnabled:     true,
      soundsEnabled:  true,
      volume:         0.7,
      ttsRate:        0.85,
      setTtsEnabled:    (v) => set({ ttsEnabled: v }),
      setSoundsEnabled: (v) => set({ soundsEnabled: v }),
      setVolume:   (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setTtsRate:  (v) => set({ ttsRate: Math.max(0.5, Math.min(1.5, v)) }),
    }),
    { name: 'lang-platform-audio' }
  )
)

export default useAudioStore
