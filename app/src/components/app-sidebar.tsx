// components/app-sidebar.tsx
"use client"

import * as React from "react"
import { Link } from "react-router-dom"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  UserCog,
  Settings,
  Palette,
  LifeBuoy,
  Send,
  Command,
} from "lucide-react"
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/auth'

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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

  const data = {
    user: {
      name: user?.name || "Usuario",
      email: user?.email || "usuario@ejemplo.com",
      avatar: "/avatars/user.jpg", // Puedes agregar tu lógica de avatar aquí
    },
    navMain: [
      {
        title: t('app.dashboard'),
        url: "/",
        icon: Home,
        isActive: true,
        permissions: undefined,
      },
      {
        title: t('app.sales'),
        url: "/sales",
        icon: ShoppingCart,
        permissions: ['sales:read'],
      },
      {
        title: t('app.inventory'),
        url: "/inventory", 
        icon: Package,
        permissions: ['inventory:read'],
      },
      {
        title: t('app.customers'),
        url: "/customers",
        icon: Users,
        permissions: ['customers:read'],
      },
      {
        title: t('app.users'),
        url: "/users",
        icon: UserCog,
        permissions: ['users:read'],
      },
    ],
    navSecondary: [
      {
        title: t('app.settings'),
        url: "/settings",
        icon: Settings,
      },
      {
        title: "Soporte",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#", 
        icon: Send,
      },
    ],
  }

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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}