import { useRouterState, Link, useMatches } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

const ROUTE_LABELS: Record<string, { label: string; showAddButton: boolean }> =
  {
    dashboard: { label: 'Дашборд', showAddButton: false },
    clients: { label: 'Клиенты', showAddButton: true },
    companies: { label: 'Компании', showAddButton: true },
    wishlist: { label: 'Вишлист', showAddButton: true },
    todos: { label: 'Задачи', showAddButton: true },
    users: { label: 'Пользователи', showAddButton: true },
    changelog: { label: 'Обновления', showAddButton: true },
    'my-company': { label: 'Моя компания', showAddButton: false },
    preferences: { label: 'Настройки', showAddButton: false },
  }

export function AppBreadcrumb() {
  const location = useRouterState({ select: (s) => s.location })
  const pathname = location.pathname
  const matches = useMatches()

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

  // Check if we're on a view page (URL contains /view at the end)
  const isViewPage = pathname.includes('/view')
  const lastSegment = segments[segments.length - 1]

  // Get loader data from the current active route match
  const activeMatch = matches[matches.length - 1]
  const loaderData = activeMatch.loaderData as
    | {
        canManage?: boolean
        company?: { name?: string }
        name?: string
        accounts?: Array<{ id: string; accountType: string }>
      }
    | undefined

  const activeTab =
    typeof location.search.tab === 'string' ? location.search.tab : undefined
  const activeAccount = loaderData?.accounts?.find(
    (account) => account.id === activeTab,
  )
  const effectiveLastSegment =
    lastSegment === 'companies' && activeAccount?.accountType === 'client'
      ? 'clients'
      : lastSegment === 'companies' && activeAccount?.accountType === 'wishlist'
        ? 'wishlist'
        : lastSegment
  const effectiveSegments = segments.slice(0, -1).concat(effectiveLastSegment)

  // Get entity name for view pages
  let entityName = ''
  if (isViewPage && loaderData) {
    // Special case for clients - use company.name
    if (
      effectiveLastSegment === 'clients' ||
      effectiveLastSegment === 'wishlist'
    ) {
      entityName = loaderData.company?.name || loaderData.name || ''
    } else {
      // For all other entities - use entity.name
      entityName = loaderData.name || ''
    }
  }

  // Check if the last segment should show an add button
  const showAddButton =
    ROUTE_LABELS[effectiveLastSegment].showAddButton &&
    (effectiveLastSegment !== 'changelog' || loaderData?.canManage === true)

  return (
    <div className="flex items-center">
      <Breadcrumb>
        <BreadcrumbList>
          {effectiveSegments.map((segment, index) => {
            const href = '/' + effectiveSegments.slice(0, index + 1).join('/')
            const label = ROUTE_LABELS[segment].label
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
                ) : isViewPage ? (
                  <>
                    <BreadcrumbLink asChild>
                      <Link to={href}>{label}</Link>
                    </BreadcrumbLink>
                  </>
                ) : (
                  <BreadcrumbPage className="font-semibold">
                    {label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            )
          })}

          {/* Show Add button on root entity pages like /clients or /users */}
          {!isViewPage && segments.length > 0 && showAddButton && (
            <BreadcrumbItem>
              <Button asChild size="sm" className="gap-2 ml-2">
                <Link to={`/${effectiveLastSegment}/new` as any}>
                  <PlusIcon className="size-4" />
                </Link>
              </Button>
            </BreadcrumbItem>
          )}

          {/* Show entity name on view pages */}
          {isViewPage && entityName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-lg">
                <BreadcrumbPage className="font-semibold">
                  {entityName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
