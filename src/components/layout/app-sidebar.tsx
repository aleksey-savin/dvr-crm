import * as React from 'react'

import { VersionSwitcher } from '@/components/layout/version-switcher'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { NavUser } from './nav-user'
import { authClient } from 'utils/auth-client'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useDepartmentStore } from '@/stores/department-store'
import { fetchSidebarDepartments } from '@/components/departments/actions'

// ---------------------------------------------------------------------------
// Nav data
// ---------------------------------------------------------------------------

const navMain = [
  {
    title: 'Обзор',
    url: '#',
    items: [
      {
        title: 'Дашборд',
        url: '/dashboard',
      },
      {
        title: 'Моя компания',
        url: '/my-company',
      },
    ],
  },
  {
    title: 'CRM | Новый бизнес',
    url: '#',
    items: [
      {
        title: 'Клиенты',
        url: '/clients',
      },
      {
        title: 'Вишлист',
        url: '/wishlist',
      },
      {
        title: 'Источники',
        url: '/sources',
      },
      {
        title: 'Инициативы',
        url: '/initiatives',
      },
    ],
  },
  {
    title: 'Активность',
    url: '#',
    items: [
      {
        title: 'Встречи',
        url: '/meetings',
      },
      {
        title: 'Задачи',
        url: '/todos',
      },
    ],
  },
  /* {
    title: 'Моя компания',
    url: '#',
    items: [
      {
        title: 'Бронирование переговорок',
        url: '/meeting-room-booking',
      },
      {
        title: 'Списки рассылок',
        url: '/mailing-lists',
      },
    ],
  }, */
  {
    title: 'Администрирование',
    url: '#',
    items: [
      {
        title: 'Компании',
        url: '/companies',
      },
      {
        title: 'Отрасли',
        url: '/industries',
      },
      {
        title: 'Целевые действия',
        url: '/target-action-types',
      },
      {
        title: 'Роли контактов',
        url: '/contact-roles',
      },
      {
        title: 'Типы сигналов',
        url: '/signal-types',
      },
      {
        title: 'Источники лидов',
        url: '/lead-sources',
      },
      {
        title: 'Причины отказа',
        url: '/refusal-reasons',
      },
      {
        title: 'Теги',
        url: '/tags',
      },
      {
        title: 'Пользователи',
        url: '/users',
      },
    ],
  },
  {
    title: '',
    url: '#',
    items: [
      {
        title: 'Настройки',
        url: '/preferences',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const setDepartments = useDepartmentStore((s) => s.setDepartments)
  const accentColor = useDepartmentStore((s) => s.selectedAccentColor)

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => fetchSidebarDepartments(),
    staleTime: 60_000,
  })

  // Seed the store whenever the list changes
  React.useEffect(() => {
    setDepartments(departments)
  }, [departments, setDepartments])

  const user = session?.user ?? {
    name: 'Guest',
    email: 'guest@example.com',
    image: '/images/avatar.png',
  }

  return (
    <Sidebar
      className={accentColor ? 'sidebar-dept-accent' : undefined}
      style={
        accentColor
          ? ({ '--dept-accent': accentColor } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      <SidebarHeader>
        <VersionSwitcher departments={departments} />
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent>
        {navMain.map((item) =>
          item.title ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.title !== 'Администрирование'}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    {item.title}
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.items.map((child) => (
                        <SidebarMenuItem key={child.title}>
                          <SidebarMenuButton asChild className="text-base">
                            <Link to={child.url}>{child.title}</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ) : (
            <SidebarGroup key="untitled">
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((child) => (
                    <SidebarMenuItem key={child.title}>
                      <SidebarMenuButton asChild className="text-base">
                        <Link to={child.url}>{child.title}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ),
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
