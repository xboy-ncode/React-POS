//import './styles.css'
import './index.css' 
import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import Topbar from './components/Layout/Topbar'
import Protected from './components/Protected'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SalesPOS from './pages/SalesPOS'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Personalization from './pages/Personalization'
import { useAuth } from './store/auth'

export default function App() {
  const hydrateAuth = useAuth((s) => s.hydrate)


  useEffect(() => {
    hydrateAuth()

  }, [hydrateAuth])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="/sales" element={<Protected required={['sales:read']} />}>
              <Route index element={<SalesPOS />} />
            </Route>
            <Route path="/inventory" element={<Protected required={['inventory:read']} />}>
              <Route index element={<Inventory />} />
            </Route>
            <Route path="/customers" element={<Protected required={['customers:read']} />}>
              <Route index element={<Customers />} />
            </Route>
            <Route path="/users" element={<Protected required={['users:read']} />}>
              <Route index element={<Users />} />
            </Route>
            <Route path="/settings" element={<Settings />} />
            <Route path="/personalization" element={<Personalization />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function AppShell() {
  return (
    <div className="grid grid-cols-[15rem_1fr] h-screen">
      <Sidebar />
      <div className="flex flex-col">
        <Topbar />
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}