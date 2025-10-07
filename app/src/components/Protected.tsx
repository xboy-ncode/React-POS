import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/auth'
import type { Permission } from '../store/auth'

interface ProtectedProps {
  required?: Permission[]
}

export default function Protected({ required = [] }: ProtectedProps) {
  const { user, isHydrated } = useAuth()

  // 🔥 ESPERA a que se complete la hidratación antes de decidir
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario después de hidratar, redirige a login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si hay permisos requeridos, verifica que el usuario los tenga
  if (required.length > 0) {
    const hasPermission = required.every(perm => 
      user.permissions.includes(perm)
    )
    
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta página
            </p>
          </div>
        </div>
      )
    }
  }

  return <Outlet />
}