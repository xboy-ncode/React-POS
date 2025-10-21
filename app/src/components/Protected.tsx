import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/auth'
import type { Permission } from '../store/auth'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedProps {
  required?: Permission[] // permisos necesarios para acceder a la ruta
  redirectTo?: string // redirección personalizada opcional
}

export default function Protected({ required = [], redirectTo = '/login' }: ProtectedProps) {
  const { user, isHydrated } = useAuth()

  // 🔹 1. Esperar a que se complete la hidratación del store antes de validar
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Cargando sesión...</p>
      </div>
    )
  }

  // 🔹 2. Si no hay usuario tras hidratar, redirigir a login
  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  // 🔹 3. Si la ruta requiere permisos, verificar que el usuario los tenga todos
  if (required.length > 0) {
    const userPerms = user.permissions || []
    const hasPermission = required.every(perm => userPerms.includes(perm))

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-2xl font-semibold mb-1">Acceso denegado</h2>
          <p className="text-muted-foreground mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <Button asChild variant="outline">
            <a href="/">Volver al inicio</a>
          </Button>
        </div>
      )
    }
  }

  // 🔹 4. Si todo está correcto, renderizar el contenido protegido
  return <Outlet />
}
