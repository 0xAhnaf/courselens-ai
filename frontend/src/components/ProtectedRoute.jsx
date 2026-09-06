import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { LoadingState } from './FeedbackState'

export default function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useAuth()
  const location = useLocation()

  if (isChecking) return <LoadingState title="Checking your session…" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
