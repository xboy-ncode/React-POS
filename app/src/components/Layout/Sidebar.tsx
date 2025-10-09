
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useCan } from '../../lib/permissions'
import { Card } from '../ui/card'
import { cn } from '@/lib/utils'

const NavItem = ({ to, label, perm }:{ to:string; label:string; perm?: any }) => {
  const location = useLocation()
  const can = perm ? useCan(perm) : true
  if (!can) return null
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-md transition-colors text-sm font-medium",
        active ? "bg-accent text-primary" : "hover:bg-muted text-muted-foreground"
      )}
    >
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const { t } = useTranslation()

  if (!open) return null
  return (
    <Card className="w-60 p-4 min-h-screen border-r rounded-none shadow-none">
      <div className="mb-6 px-2 text-xl font-semibold">POS</div>
      <nav className="flex flex-col gap-1">
        <NavItem to="/" label={t('app.dashboard')} />
        <NavItem to="/sales" label={t('app.sales')} perm={['sales:read']} />
        <NavItem to="/movements" label={t('app.movements')} perm={['movements:read']} />
        <NavItem to="/inventory" label={t('app.inventory')} perm={['inventory:read']} />
        <NavItem to="/customers" label={t('app.customers')} perm={['customers:read']} />
        <NavItem to="/users" label={t('app.users')} perm={['users:read']} />
        <NavItem to="/settings" label={t('app.settings')} />
        <NavItem to="/personalization" label={t('app.personalization')} />
      </nav>
    </Card>
  )
}
