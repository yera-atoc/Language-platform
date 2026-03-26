import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_LIVES     = 5
const REGEN_MS      = 4 * 60 * 60 * 1000  // 4 hours per life
const RESTORE_COST  = 50                   // XP cost to instantly restore all lives

const useUserStore = create(
  persist(
    (set, get) => ({
      user:           null,
      profile:        null,
      xp:             0,
      level:          1,
      streak:         0,
      lives:          MAX_LIVES,
      maxLives:       MAX_LIVES,
      lastActiveDate: null,
      achievements:   [],
      nextLifeAt:     null,   // timestamp when next life regenerates

      setUser:    (user)    => set({ user }),
      setProfile: (profile) => set({ profile }),

      // ── XP & Level ──────────────────────────────────────

      addXP: (amount) => {
        const newXP    = get().xp + amount
        const newLevel = Math.floor(newXP / 1000) + 1
        set({ xp: newXP, level: newLevel })
      },

      // ── Lives ────────────────────────────────────────────

      loseLife: () => {
        const { lives, nextLifeAt } = get()
        if (lives <= 0) return

        const newLives = lives - 1
        const now      = Date.now()

        // Start regen timer when dropping below max for the first time
        const newNextLifeAt = newLives < MAX_LIVES && !nextLifeAt
          ? now + REGEN_MS
          : nextLifeAt

        set({ lives: newLives, nextLifeAt: newNextLifeAt })
      },

      // Call this periodically (e.g. every minute) to tick the regen
      tickLives: () => {
        const { lives, nextLifeAt } = get()
        if (lives >= MAX_LIVES || !nextLifeAt) return

        const now = Date.now()
        if (now < nextLifeAt) return

        // One or more lives have regenerated
        const elapsed  = now - nextLifeAt
        const restored = 1 + Math.floor(elapsed / REGEN_MS)
        const newLives = Math.min(lives + restored, MAX_LIVES)
        const newNext  = newLives >= MAX_LIVES
          ? null
          : nextLifeAt + restored * REGEN_MS

        set({ lives: newLives, nextLifeAt: newNext })
      },

      // Spend XP to instantly restore all lives
      restoreAllLives: () => {
        const { xp } = get()
        if (xp < RESTORE_COST) return false
        set({ lives: MAX_LIVES, nextLifeAt: null, xp: xp - RESTORE_COST })
        return true
      },

      // Time (ms) remaining until next life regenerates
      getNextLifeMs: () => {
        const { lives, nextLifeAt } = get()
        if (lives >= MAX_LIVES || !nextLifeAt) return 0
        return Math.max(0, nextLifeAt - Date.now())
      },

      // Time (ms) until fully restored
      getFullRestoreMs: () => {
        const { lives, nextLifeAt } = get()
        if (lives >= MAX_LIVES || !nextLifeAt) return 0
        const missingLives = MAX_LIVES - lives
        return Math.max(0, nextLifeAt - Date.now() + (missingLives - 1) * REGEN_MS)
      },

      // ── Streak ───────────────────────────────────────────

      updateStreak: () => {
        const today     = new Date().toDateString()
        const last      = get().lastActiveDate
        if (last === today) return
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const newStreak = last === yesterday ? get().streak + 1 : 1
        set({ streak: newStreak, lastActiveDate: today })
      },

      // ── Achievements ─────────────────────────────────────

      addAchievement: (id) => {
        const achievements = get().achievements
        if (!achievements.includes(id)) set({ achievements: [...achievements, id] })
      },

      // ── Reset ────────────────────────────────────────────

      reset: () => set({
        user: null, profile: null,
        xp: 0, level: 1, streak: 0,
        lives: MAX_LIVES, maxLives: MAX_LIVES,
        lastActiveDate: null, achievements: [],
        nextLifeAt: null,
      }),
    }),
    { name: 'lang-platform-user' }
  )
)

export { MAX_LIVES, REGEN_MS, RESTORE_COST }
export default useUserStore
