
import { create } from 'zustand'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  accent: string
  sidebarOpen: boolean
  setTheme: (t: UIState['theme']) => void
  setAccent: (a: string) => void
  setSidebarOpen: (open: boolean) => void
  hydrate: () => void
}

const defaultAccent = '#6366F1' // indigo

export const useUI = create<UIState>((set, get) => ({
  theme: 'system',
  accent: defaultAccent,
  sidebarOpen: true,
  hydrate: () => {
    const theme = (localStorage.getItem('theme') as UIState['theme']) || 'system'
    const accent = localStorage.getItem('accent') || defaultAccent
    set({ theme, accent })
    applyTheme(theme)
    applyAccent(accent)
  },
  setTheme: (t) => {
    set({ theme: t })
    localStorage.setItem('theme', t)
    applyTheme(t)
  },
  setAccent: (a) => {
    set({ accent: a })
    localStorage.setItem('accent', a)
    applyAccent(a)
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open })
}))

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement.classList
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  if (isDark) root.add('dark'); else root.remove('dark')
}

function applyAccent(color: string) {
  // Convert hex to rgb for Tailwind CSS CSS variables
  const hex = color.replace('#', '')
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  document.documentElement.style.setProperty('--accent', `${r} ${g} ${b}`)
  document.documentElement.style.setProperty('--primary', `${r} ${g} ${b}`)
}
