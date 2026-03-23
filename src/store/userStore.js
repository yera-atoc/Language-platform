import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,

      // Gamification state
      xp: 0,
      level: 1,
      streak: 0,
      lives: 5,
      maxLives: 5,
      lastActiveDate: null,
      achievements: [],

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),

      addXP: (amount) => {
        const newXP = get().xp + amount
        const newLevel = Math.floor(newXP / 1000) + 1
        set({ xp: newXP, level: newLevel })
      },

      loseLife: () => {
        const lives = get().lives
        if (lives > 0) set({ lives: lives - 1 })
      },

      restoreLife: () => {
        const { lives, maxLives } = get()
        if (lives < maxLives) set({ lives: lives + 1 })
      },

      updateStreak: () => {
        const today = new Date().toDateString()
        const last = get().lastActiveDate
        if (last === today) return
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const newStreak = last === yesterday ? get().streak + 1 : 1
        set({ streak: newStreak, lastActiveDate: today })
      },

      addAchievement: (id) => {
        const achievements = get().achievements
        if (!achievements.includes(id)) {
          set({ achievements: [...achievements, id] })
        }
      },

      reset: () => set({
        user: null, profile: null,
        xp: 0, level: 1, streak: 0,
        lives: 5, lastActiveDate: null, achievements: [],
      }),
    }),
    { name: 'lang-platform-user' }
  )
)

export default useUserStore
