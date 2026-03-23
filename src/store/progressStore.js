import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useProgressStore = create(
  persist(
    (set, get) => ({
      // { turkish: { a1: { lesson_1: { completed: true, score: 95, attempts: 1 } } } }
      progress: {},

      completeLesson: (language, level, lessonId, score) => {
        const prev = get().progress
        set({
          progress: {
            ...prev,
            [language]: {
              ...(prev[language] || {}),
              [level]: {
                ...((prev[language] || {})[level] || {}),
                [lessonId]: {
                  completed: true,
                  score,
                  completedAt: new Date().toISOString(),
                  attempts: (((prev[language] || {})[level] || {})[lessonId]?.attempts || 0) + 1,
                },
              },
            },
          },
        })
      },

      getLessonProgress: (language, level, lessonId) => {
        return get().progress?.[language]?.[level]?.[lessonId] || null
      },

      getLevelProgress: (language, level) => {
        const levelData = get().progress?.[language]?.[level] || {}
        const completed = Object.values(levelData).filter(l => l.completed).length
        return { completed, total: Object.keys(levelData).length }
      },

      isLessonUnlocked: (language, level, lessonIndex) => {
        if (lessonIndex === 0) return true
        const levelData = get().progress?.[language]?.[level] || {}
        return !!levelData[`lesson_${lessonIndex}`]?.completed
      },

      reset: () => set({ progress: {} }),
    }),
    { name: 'lang-platform-progress' }
  )
)

export default useProgressStore
