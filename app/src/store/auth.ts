import { create } from 'zustand'

// Types for auth
export type Permission = 
  | 'inventory:read' | 'inventory:write' 
  | 'sales:read' | 'sales:write'
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
  signIn: (payload: { nombre_usuario: string; clave: string }) => Promise<void>;
  signOut: () => void;
  hydrate: () => void;
}

// Role to permissions mapping (fallback if backend does not send granular permissions)
export const ROLE_DEFAULT_PERMS: Record<Role, Permission[]> = {
  admin: ['inventory:read','inventory:write','sales:read','sales:write','customers:read','customers:write','users:read','users:write','settings:write'],
  manager: ['inventory:read','inventory:write','sales:read','sales:write','customers:read','customers:write','users:read'],
  cashier: ['sales:read','sales:write','customers:read']
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  hydrate: () => {
    // Restore from localStorage on app load
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      set({ token, user: JSON.parse(user) })
    }
  },
  signIn: async ({ nombre_usuario, clave }) => {
    set({ loading: true })
    try {
      // Call your Node API auth endpoint
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario, clave })
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      
      // Map backend response to frontend User interface
      const user: User = {
        id: data.usuario.id_usuario.toString(),
        name: data.usuario.nombre_usuario,
        email: '', // You might want to add email to your backend user model
        role: data.usuario.rol as Role,
        permissions: ROLE_DEFAULT_PERMS[data.usuario.rol as Role] || []
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ token: data.token, user })
    } catch (e) {
      console.error(e)
      throw e
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