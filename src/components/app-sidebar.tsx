import * as React from 'react'

import { SearchForm } from '@/components/search-form'
import { VersionSwitcher } from '@/components/version-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavUser } from './nav-user'
import { authClient } from 'utils/auth-client'
import { Link } from '@tanstack/react-router'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const data = {
    user: session?.user || {
      name: 'Guest',
      email: 'guest@example.com',
      image: '/images/avatar.png',
    },
    versions: ['Руководитель', 'Менеджер', 'Администратор', 'Клиент'],
    navMain: [
      {
        title: 'Основное',
        url: '#',
        items: [
          {
            title: 'Дашборд',
            url: '/dashboard',
            isActive: false,
          },
          {
            title: 'Клиенты',
            url: '/clients',
            isActive: false,
          },
          {
            title: 'Вишлист',
            url: '/wishlist',
            isActive: false,
          },
          {
            title: 'Ту-Ду',
            url: '/todos',
            isActive: false,
          },
        ],
      },
      {
        title: 'AI-сервисы',
        url: '#',
        items: [
          {
            title: 'Мониторинг активности',
            url: '/clients-activity',
            isActive: false,
          },
          {
            title: 'Отслеживание отзывов',
            url: '/tracking-reviews',
            isActive: false,
          },
        ],
      },

      {
        title: 'Администрирование',
        url: '#',
        items: [
          {
            title: 'Компании',
            url: '/companies',
            isActive: false,
          },
          {
            title: 'Пользователи',
            url: '/users',
            isActive: false,
          },
          {
            title: 'Бизнес-юниты',
            url: '/departments',
            isActive: false,
          },
          {
            title: 'Настройки',
            url: '/preferences',
            isActive: false,
          },
        ],
      },
    ],
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            {item.title && <SidebarGroupLabel>{item.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      className="text-base"
                    >
                      <Link to={item.url}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
