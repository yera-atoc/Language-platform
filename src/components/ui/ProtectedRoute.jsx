import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/app/firebase'

export default function ProtectedRoute() {
  const [user, setUser]       = useState(undefined) // undefined = still checking
  const [ready, setReady]     = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
    return unsubscribe
  }, [])

  // Still checking Firebase auth state — show spinner
  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080B14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit',sans-serif", color: '#555E80', fontSize: 14,
      }}>
        <div style={{
          width: 28, height: 28, border: '2.5px solid rgba(108,99,255,0.3)',
          borderTopColor: '#6C63FF', borderRadius: '50%',
          animation: 'spin .7s linear infinite',
          marginRight: 12,
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Загружаем…
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/auth" replace />
}
