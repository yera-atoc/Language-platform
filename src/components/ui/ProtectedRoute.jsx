import { Navigate, Outlet } from 'react-router-dom'
import useUserStore from '@store/userStore'

export default function ProtectedRoute() {
  const { user } = useUserStore()
  return user ? <Outlet /> : <Navigate to="/auth" replace />
}
