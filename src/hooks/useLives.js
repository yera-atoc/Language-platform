import { useState, useEffect, useCallback } from 'react'
import useUserStore, { MAX_LIVES, REGEN_MS, RESTORE_COST } from '@store/userStore'

// ── Helpers ──────────────────────────────────────────────────

export function formatTime(ms) {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * useLives
 *
 * Returns live-updating lives state and controls.
 * Mount once in a top-level component (e.g. Home or a persistent layout).
 */
export function useLives() {
  const {
    lives, maxLives,
    tickLives, getNextLifeMs, getFullRestoreMs,
    restoreAllLives,
  } = useUserStore()

  const xp = useUserStore(s => s.xp)

  const [nextLifeMs,    setNextLifeMs]    = useState(getNextLifeMs())
  const [fullRestoreMs, setFullRestoreMs] = useState(getFullRestoreMs())
  const [regenPct,      setRegenPct]      = useState(0)

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      tickLives()
      const next = getNextLifeMs()
      const full = getFullRestoreMs()
      setNextLifeMs(next)
      setFullRestoreMs(full)
      setRegenPct(next > 0 ? Math.round(((REGEN_MS - next) / REGEN_MS) * 100) : 0)
    }, 1000)
    return () => clearInterval(id)
  }, [tickLives, getNextLifeMs, getFullRestoreMs])

  const canAffordRestore = xp >= RESTORE_COST
  const isFullyRestored  = lives >= maxLives
  const hasLives         = lives > 0

  const handleRestoreWithXP = useCallback(() => {
    return restoreAllLives()
  }, [restoreAllLives])

  return {
    lives,
    maxLives,
    hasLives,
    isFullyRestored,
    nextLifeMs,
    fullRestoreMs,
    regenPct,
    nextLifeFormatted:    formatTime(nextLifeMs),
    fullRestoreFormatted: formatTime(fullRestoreMs),
    restoreCost:          RESTORE_COST,
    canAffordRestore,
    restoreWithXP:        handleRestoreWithXP,
  }
}
