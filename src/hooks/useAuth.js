import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/app/firebase'
import useUserStore from '@store/userStore'

export function useAuth() {
  const { user, setUser, setProfile } = useUserStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Load or create profile
        const profileRef = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(profileRef)
        if (snap.exists()) {
          setProfile(snap.data())
        } else {
          const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Student',
            createdAt: new Date().toISOString(),
            languages: [],
            xp: 0,
            level: 1,
            streak: 0,
          }
          await setDoc(profileRef, newProfile)
          setProfile(newProfile)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    })
    return unsubscribe
  }, [])

  return { user }
}
