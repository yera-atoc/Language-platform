import { useEffect, useRef, useCallback } from 'react'
import {
  doc, getDoc, setDoc, updateDoc,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/app/firebase'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'

// ── Debounce helper ──────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

// ── Main hook ────────────────────────────────────────────────

/**
 * useFirestoreSync
 *
 * Call once at the top of your app (e.g. in App.jsx).
 * When a user is signed in it:
 *   1. Loads their saved data from Firestore into Zustand stores
 *   2. Subscribes to real-time changes (multi-device sync)
 *   3. Pushes local changes back to Firestore (debounced 2s)
 */
export function useFirestoreSync() {
  const { user, setProfile, xp, level, streak, lives, lastActiveDate, achievements } = useUserStore()
  const { progress, getLevelProgress } = useProgressStore()
  const { setUser } = useUserStore.getState ? useUserStore : { setUser: () => {} }

  const uid           = user?.uid
  const isSyncing     = useRef(false)
  const unsubscribeRef = useRef(null)
  const loadedRef      = useRef(false)

  // ── Load from Firestore → Zustand ──────────────────────────

  const loadFromFirestore = useCallback(async (uid) => {
    if (!uid) return
    try {
      const userRef     = doc(db, 'users', uid)
      const progressRef = doc(db, 'progress', uid)

      const [userSnap, progressSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(progressRef),
      ])

      if (userSnap.exists()) {
        const data = userSnap.data()
        // Merge Firestore data into Zustand (Firestore wins on first load)
        useUserStore.setState({
          xp:              data.xp              ?? 0,
          level:           data.level           ?? 1,
          streak:          data.streak          ?? 0,
          lives:           data.lives           ?? 5,
          lastActiveDate:  data.lastActiveDate  ?? null,
          achievements:    data.achievements    ?? [],
          profile:         data,
        })
      }

      if (progressSnap.exists()) {
        useProgressStore.setState({
          progress: progressSnap.data().lessons ?? {},
        })
      }

      loadedRef.current = true
    } catch (err) {
      console.warn('[Firestore] Load error:', err.message)
    }
  }, [])

  // ── Push Zustand → Firestore (debounced) ──────────────────

  const pushUserData = useCallback(async (uid, data) => {
    if (!uid) return
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp(),
      })
    } catch {
      // Doc might not exist yet — create it
      try {
        await setDoc(doc(db, 'users', uid), {
          ...data,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      } catch (e) {
        console.warn('[Firestore] Push user error:', e.message)
      }
    }
  }, [])

  const pushProgressData = useCallback(async (uid, progress) => {
    if (!uid) return
    try {
      await setDoc(doc(db, 'progress', uid), {
        lessons:   progress,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (e) {
      console.warn('[Firestore] Push progress error:', e.message)
    }
  }, [])

  // Debounced versions (2s delay — avoids writes on every keystroke/render)
  const debouncedPushUser     = useDebounce(pushUserData,     2000)
  const debouncedPushProgress = useDebounce(pushProgressData, 2000)

  // ── Effect: load on sign-in, unsubscribe on sign-out ──────

  useEffect(() => {
    if (!uid) {
      loadedRef.current = false
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
      return
    }

    // Initial load
    loadFromFirestore(uid)

    // Real-time listener for multi-device sync
    const userRef = doc(db, 'users', uid)
    unsubscribeRef.current = onSnapshot(userRef, (snap) => {
      if (!snap.exists() || !loadedRef.current) return
      const data = snap.data()

      // Only merge if remote data is newer
      const remoteXP = data.xp ?? 0
      const localXP  = useUserStore.getState().xp
      if (remoteXP > localXP) {
        useUserStore.setState({
          xp:             data.xp,
          level:          data.level,
          streak:         data.streak,
          lives:          data.lives,
          lastActiveDate: data.lastActiveDate,
          achievements:   data.achievements ?? [],
          profile:        data,
        })
      }
    }, (err) => {
      console.warn('[Firestore] Snapshot error:', err.message)
    })

    return () => {
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
    }
  }, [uid, loadFromFirestore])

  // ── Effect: push user stats when they change ──────────────

  useEffect(() => {
    if (!uid || !loadedRef.current) return
    debouncedPushUser(uid, { xp, level, streak, lives, lastActiveDate, achievements })
  }, [uid, xp, level, streak, lives, lastActiveDate, achievements, debouncedPushUser])

  // ── Effect: push progress when it changes ────────────────

  useEffect(() => {
    if (!uid || !loadedRef.current) return
    debouncedPushProgress(uid, progress)
  }, [uid, progress, debouncedPushProgress])
}

// ── Standalone sync functions (call from anywhere) ───────────

/**
 * Force-push current Zustand state to Firestore immediately.
 * Use after a lesson completes for instant persistence.
 */
export async function syncNow(uid) {
  if (!uid) return
  try {
    const { xp, level, streak, lives, lastActiveDate, achievements } = useUserStore.getState()
    const { progress } = useProgressStore.getState()

    await Promise.all([
      setDoc(doc(db, 'users', uid), {
        xp, level, streak, lives, lastActiveDate, achievements,
        updatedAt: serverTimestamp(),
      }, { merge: true }),
      setDoc(doc(db, 'progress', uid), {
        lessons:   progress,
        updatedAt: serverTimestamp(),
      }, { merge: true }),
    ])
  } catch (e) {
    console.warn('[Firestore] syncNow error:', e.message)
  }
}

/**
 * Pull latest data from Firestore into Zustand.
 * Use when app comes back to foreground.
 */
export async function pullFromFirestore(uid) {
  if (!uid) return
  try {
    const [userSnap, progressSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'progress', uid)),
    ])

    if (userSnap.exists()) {
      const d = userSnap.data()
      useUserStore.setState({
        xp: d.xp ?? 0, level: d.level ?? 1,
        streak: d.streak ?? 0, lives: d.lives ?? 5,
        lastActiveDate: d.lastActiveDate ?? null,
        achievements: d.achievements ?? [], profile: d,
      })
    }
    if (progressSnap.exists()) {
      useProgressStore.setState({ progress: progressSnap.data().lessons ?? {} })
    }
  } catch (e) {
    console.warn('[Firestore] pullFromFirestore error:', e.message)
  }
}
