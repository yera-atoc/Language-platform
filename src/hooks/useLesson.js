import { useState, useCallback } from 'react'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'

export function useLesson(language, level, lessonId, exercises = []) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const { addXP, loseLife } = useUserStore()
  const { completeLesson } = useProgressStore()

  const currentExercise = exercises[currentIndex]
  const isLastExercise = currentIndex === exercises.length - 1

  const submitAnswer = useCallback((answer) => {
    const exercise = exercises[currentIndex]
    const isCorrect = answer === exercise.correctAnswer
    setAnswers(prev => ({ ...prev, [currentIndex]: { answer, isCorrect } }))

    if (!isCorrect) loseLife()
    setShowResult(true)
  }, [currentIndex, exercises, loseLife])

  const nextExercise = useCallback(() => {
    setShowResult(false)
    if (isLastExercise) {
      const correct = Object.values(answers).filter(a => a.isCorrect).length
      const score = Math.round((correct / exercises.length) * 100)
      const xpEarned = Math.round(score * 0.5)
      addXP(xpEarned)
      completeLesson(language, level, lessonId, score)
      setIsCompleted(true)
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }, [isLastExercise, answers, exercises.length, addXP, completeLesson, language, level, lessonId])

  const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0

  return {
    currentExercise,
    currentIndex,
    totalExercises: exercises.length,
    progress,
    showResult,
    isCompleted,
    answers,
    submitAnswer,
    nextExercise,
  }
}
