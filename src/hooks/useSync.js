import { useState, useCallback } from 'react'
import useUserStore from '@store/userStore'
import { syncNow, pullFromFirestore } from './useFirestoreSync'

/**
 * useSync
 * Exposes manual sync controls + sync status to UI components.
 *
 * Usage:
 *   const { syncing, lastSync, forceSave, forceLoad } = useSync()
 */
export function useSync() {
  const uid = useUserStore(s => s.user?.uid)
  const [syncing, setSyncing]   = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [error, setError]       = useState(null)

  const forceSave = useCallback(async () => {
    if (!uid || syncing) return
    setSyncing(true); setError(null)
    try {
      await syncNow(uid)
      setLastSync(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setSyncing(false)
    }
  }, [uid, syncing])

  const forceLoad = useCallback(async () => {
    if (!uid || syncing) return
    setSyncing(true); setError(null)
    try {
      await pullFromFirestore(uid)
      setLastSync(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setSyncing(false)
    }
  }, [uid, syncing])

  return { syncing, lastSync, error, forceSave, forceLoad }
}
