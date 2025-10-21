// /store/auth.ts
import { create } from 'zustand'

// Types for auth
export type Permission =
  | 'inventory:read' | 'inventory:write'
  | 'sales:read' | 'sales:write'
  | 'movements:read' | 'movements:write'
  | 'customers:read' | 'customers:write'
  | 'users:read' | 'users:write'
  | 'settings:write';

export type Role = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isHydrated: boolean;
  signIn: (payload: { nombre_usuario: string; clave: string }) => Promise<void>;
  signOut: () => void;
  hydrate: () => void;
}

// Role to permissions mapping
export const ROLE_DEFAULT_PERMS: Record<Role, Permission[]> = {
  admin: [
    'inventory:read', 'inventory:write',
    'sales:read', 'sales:write',
    'movements:read', 'movements:write',
    'customers:read', 'customers:write',
    'users:read', 'users:write',
    'settings:write'
  ],
  manager: [
    'inventory:read', 'inventory:write',
    'sales:read', 'sales:write',
    'movements:read', 'movements:write',
    'customers:read', 'customers:write',
    'users:read'
  ],
  cashier: ['sales:read', 'sales:write', 'customers:read']
}

const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === 'true'

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  isHydrated: false,

  hydrate: () => {
    if (DISABLE_AUTH) {
      const mockUser: User = {
        id: '1',
        name: 'Dev Admin',
        email: 'dev@example.com',
        role: 'admin',
        permissions: ROLE_DEFAULT_PERMS.admin
      }
      set({ user: mockUser, token: 'mock-token', isHydrated: true })
      return
    }

    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User

        if (!user.permissions || user.permissions.length === 0) {
          user.permissions = ROLE_DEFAULT_PERMS[user.role] || []
        }

        set({ token, user, isHydrated: true })
      } catch (error) {
        console.error('Error parsing user from localStorage:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ isHydrated: true })
      }
    } else {
      set({ isHydrated: true })
    }
  },

  signIn: async ({ nombre_usuario, clave }) => {
    set({ loading: true })
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario, clave })
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()

      // 🔧 Mapeo seguro de roles desde backend a frontend
      const roleMap: Record<string, Role> = {
        ADMIN: 'admin',
        CAJERO: 'cashier',
        MANAGER: 'manager'
      }

      const rawRole = (data.usuario.rol as string).toUpperCase()
      const role = roleMap[rawRole] || 'cashier'

      const user: User = {
        id: data.usuario.id_usuario.toString(),
        name: data.usuario.nombre_usuario,
        email: data.usuario.email || '',
        role,
        permissions: ROLE_DEFAULT_PERMS[role] || []
      }


      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(user))

      set({ token: data.token, user })
    } finally {
      set({ loading: false })
    }
  },

  signOut: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  }
}))