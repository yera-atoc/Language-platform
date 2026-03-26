import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { useFirestoreSync, pullFromFirestore } from '@hooks/useFirestoreSync'
import { useAuth } from '@hooks/useAuth'
import useUserStore from '@store/userStore'
import '@styles/globals.css'

// ── Sync wrapper ─────────────────────────────────────────────
function SyncLayer() {
  useAuth()           // keeps Zustand user.uid in sync with Firebase Auth
  useFirestoreSync()  // bidirectional Firestore sync

  const uid = useUserStore(s => s.user?.uid)

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && uid) {
        pullFromFirestore(uid)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [uid])

  return null
}

// ── Root App ─────────────────────────────────────────────────
export default function App() {
  return (
    <RouterProvider router={router}>
      <SyncLayer />
    </RouterProvider>
  )
}
