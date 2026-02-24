import { useRouterState, Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Дашборд',
  clients: 'Клиенты',
  companies: 'Компании',
  todos: 'Ту-Ду',
  users: 'Пользователи',
  departments: 'Бизнес-юниты',
  preferences: 'Настройки',
}

export function AppBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const allSegments = pathname.split('/').filter(Boolean)

  // Only include segments that have a known label — stop at the first dynamic
  // param (UUID, numeric ID) or action word (new, update, delete, …).
  // This prevents dialog/modal routes from appearing in the breadcrumb while
  // staying flexible: just add an entry to ROUTE_LABELS for any new real page.
  const segments: string[] = []
  for (const seg of allSegments) {
    if (!(seg in ROUTE_LABELS)) break
    segments.push(seg)
  }

  if (segments.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const label = ROUTE_LABELS[segment] ?? segment
          const isLast = index === segments.length - 1

          return (
            <BreadcrumbItem key={href} className="text-lg">
              {!isLast ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link to={href}>{label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage className="font-semibold">
                  {label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
