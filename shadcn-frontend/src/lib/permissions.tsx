
import { useAuth } from '../store/auth'
import type { Permission } from '../store/auth'

// Hook to check permissions on demand
export function useCan(required: Permission | Permission[]) {
  const user = useAuth((s) => s.user)
  const requiredArr = Array.isArray(required) ? required : [required]
  const granted = user?.permissions || []
  const ok = requiredArr.every((p) => granted.includes(p))
  return ok
}

// Higher Order Component to hide or disable by permission
export function IfCan({ permission, children }: { permission: Permission | Permission[], children: React.ReactNode }) {
  const ok = useCan(permission)
  if (!ok) return null
  return <>{children}</>
}
