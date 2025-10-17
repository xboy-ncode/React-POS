//import './styles.css'
import './index.css' 
import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Nuevos imports para el sidebar de shadcn
import { AppSidebar } from "./components/app-sidebar"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "./components/ui/breadcrumb"
import { Separator } from "./components/ui/separator"
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "./components/ui/sidebar"
import { Button } from "./components/ui/button"
import { ModeToggle } from "./components/ModeToggle"

// Imports existentes
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
import Movements from './pages/Movements'

// Función auxiliar para generar breadcrumbs basado en la ruta
function generateBreadcrumbs(pathname: string, t: (key: string) => string) {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return [{ label: t('app.dashboard'), href: '/' }]
  }
  
  const breadcrumbs = [{ label: t('app.dashboard'), href: '/' }]
  
  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = t(`app.${segment}`) || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href })
  })
  
  return breadcrumbs
}

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
            <Route path="/movements" element={<Protected required={['movements:read']} />}>
              <Route index element={<Movements />} />
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
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const location = useLocation()
  
  const breadcrumbs = generateBreadcrumbs(location.pathname, t)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header con breadcrumbs y controles */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            
            {/* Breadcrumbs dinámicos */}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator className="mx-2" />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Controles del header (idioma, tema, usuario, logout) */}
          <div className="flex items-center gap-2 px-4">
            {/* Selector de idioma */}
            {/* <select
              aria-label="Language"
              className="px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-28"
              value={i18n.language}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value)
                localStorage.setItem('lang', e.target.value)
              }}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select> */}

            {/* Selector de tema */}
            <ModeToggle />

            {/* Usuario actual */}
            <div className="text-sm text-muted-foreground">
              {user?.name ? user.name.toUpperCase() : "Invitado"}
            </div>
            
            {/* Botón de logout */}
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              {t('app.logout')}
            </Button>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}