// components/app-sidebar.tsx
import * as React from "react"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  UserCog,
  Settings,
  Command,
  ArrowUpDown
} from "lucide-react"
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/auth'
import type { Permission } from '../lib/permissions'

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const { user } = useAuth()

  // 🔒 helper para validar permisos
  const hasPermission = (permissions?: Permission[]) => {
    if (!permissions || permissions.length === 0) return true
    const userPerms = user?.permissions || []
    return permissions.every(p => userPerms.includes(p))
  }

  // 🔹 Definición base del menú
  const navMain = [
    {
      title: t('app.dashboard'),
      url: "/",
      icon: Home,
      permissions: undefined,
    },
    {
      title: t('app.sales'),
      url: "/sales",
      icon: ShoppingCart,
      permissions: ['sales:read'] as Permission[],
    },
    {
      title: t('app.movements'),
      url: "/movements",
      icon: ArrowUpDown,
      permissions: ['movements:read'] as Permission[],
    },
    {
      title: t('app.inventory'),
      url: "/inventory",
      icon: Package,
      permissions: ['inventory:read'] as Permission[],
    },
    {
      title: t('app.customers'),
      url: "/customers",
      icon: Users,
      permissions: ['customers:read'] as Permission[],
    },
    {
      title: t('app.users'),
      url: "/users",
      icon: UserCog,
      permissions: ['users:read'] as Permission[],
    },
  ]

  const navSecondary = [
    {
      title: t('app.settings'),
      url: "/settings",
      icon: Settings,
      permissions: ['settings:write'] as Permission[],
    },
  ]

  // ✅ Filtrar por permisos antes de renderizar
  const filteredNavMain = navMain.filter(item => hasPermission(item.permissions))
  const filteredNavSecondary = navSecondary.filter(item => hasPermission(item.permissions))


  return (
    
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">POS System</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
    </Sidebar>
  )
}
