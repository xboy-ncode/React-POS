
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUI } from '../../store/ui'
import { useCan } from '../../lib/permissions'

const NavItem = ({ to, label, perm }:{ to:string; label:string; perm?: any }) => {
  const location = useLocation()
  const can = perm ? useCan(perm) : true
  if (!can) return null
  const active = location.pathname === to
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-2 rounded-xl2 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${active ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}>
      <span className="text-sm">{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const { t } = useTranslation()
  const open = useUI((s) => s.sidebarOpen)
  if (!open) return null
  return (
    <aside className="w-60 p-4 border-r border-neutral-200 dark:border-neutral-800">
      <div className="mb-6 px-2 text-xl font-semibold">POS</div>
      <nav className="flex flex-col gap-1">
        <NavItem to="/" label={t('app.dashboard')} />
        <NavItem to="/sales" label={t('app.sales')} perm={['sales:read']} />
        <NavItem to="/inventory" label={t('app.inventory')} perm={['inventory:read']} />
        <NavItem to="/customers" label={t('app.customers')} perm={['customers:read']} />
        <NavItem to="/users" label={t('app.users')} perm={['users:read']} />
        <NavItem to="/settings" label={t('app.settings')} />
        <NavItem to="/personalization" label={t('app.personalization')} />
      </nav>
    </aside>
  )
}
