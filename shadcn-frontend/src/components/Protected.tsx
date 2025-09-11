
import { Navigate, Outlet } from 'react-router-dom'
import type { Permission } from '../store/auth'
import { useAuth } from '../store/auth'
import { useCan } from '../lib/permissions'

export default function Protected({ required }: { required?: Permission | Permission[] }) {
  const { user, token } = useAuth()
  if (!token || !user) return <Navigate to="/login" replace />
  if (required && !useCan(required)) return <div className="p-6 text-center text-muted">⛔️ {`You do not have access to this section.`}</div>
  return <Outlet />
}
