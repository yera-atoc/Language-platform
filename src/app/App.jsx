import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { useFirestoreSync, pullFromFirestore } from '@hooks/useFirestoreSync'
import useUserStore from '@store/userStore'
import '@styles/globals.css'

// ── Sync wrapper ─────────────────────────────────────────────
// Separate component so hooks run inside RouterProvider context
function SyncLayer() {
  // Activate bidirectional Firestore sync
  useFirestoreSync()

  const uid = useUserStore(s => s.user?.uid)

  // Pull fresh data when user returns to the tab
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
