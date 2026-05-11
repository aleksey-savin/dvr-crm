import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  EditIcon,
  Trash2Icon,
  UsersIcon,
  InfoIcon,
  HeartIcon,
  UsersRoundIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TodoComments } from '@/components/todos/todo-comments'
import { Section } from '@/components/companyAccounts/client-view/shared'
import { RevenueSection } from '@/components/companies/revenue-section'
import { HooksSection } from '@/components/companyAccounts/wishlist-view/hooks-section'
import { WishlistTodosSection } from '@/components/companyAccounts/wishlist-view/wishlist-todos-section'
import { fetchWishlistClient } from '@/components/companyAccounts/actions'

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/wishlist_/$id/view')({
  component: RouteComponent,
  loader: async ({ params }) => fetchWishlistClient({ data: params }),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()

  const refresh = () => router.invalidate()

  const defaultDepartmentId = item.businessUnit.id

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
      {/* ------------------------------------------------------------------ */}
      {/* Left column                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-0" style={{ height: '79svh' }}>
          {/* Header */}
          <CardHeader className="border-b shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Button asChild variant="ghost" size="icon-sm">
                  <Link to="/wishlist">
                    <ArrowLeftIcon className="size-4" />
                  </Link>
                </Button>
                <h1 className="text-lg font-semibold leading-tight truncate">
                  {item.company.name}
                </h1>
                <Badge variant="secondary" className="shrink-0">
                  {item.businessUnit.name}
                </Badge>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/wishlist/$id/update" params={{ id: item.id }}>
                    <EditIcon className="size-4" />
                    Изменить
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="destructiveGhost"
                  size="sm"
                  className="gap-2"
                >
                  <Link to="/wishlist/$id/delete" params={{ id: item.id }}>
                    <Trash2Icon className="size-4" />
                    Удалить
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Scrollable body */}
          <CardContent className="flex-1 min-h-0 overflow-y-auto pt-4 flex flex-col gap-6">
            {/* Responsibles */}
            <Section icon={UsersIcon} title="Ответственный">
              {!item.owner ? (
                <p className="text-sm text-muted-foreground italic">
                  Ответственный не назначен
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{item.owner.name}</Badge>
                </div>
              )}
            </Section>

            {/* Industry */}
            {item.company.industry && (
              <Section icon={InfoIcon} title="Отрасль">
                <p className="text-sm text-muted-foreground">
                  {item.company.industry}
                </p>
              </Section>
            )}

            {/* Why */}
            {item.why && (
              <Section icon={HeartIcon} title="Почему хотим">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.why}
                </p>
              </Section>
            )}

            <Separator />

            {/* Revenue cards */}
            <RevenueSection
              revenues={item.company.revenues}
              companyId={item.company.id}
              onRefresh={refresh}
            />

            <Separator />

            {/* Hooks */}
            <HooksSection
              hooks={item.hooks}
              wishlistClientId={item.id}
              onRefresh={refresh}
            />

            <Separator />

            {/* Todos */}
            <WishlistTodosSection
              todos={item.todos}
              wishlistClientId={item.id}
              companyName={item.company.name}
              defaultDepartmentId={defaultDepartmentId}
              onRefresh={refresh}
            />

            <Separator />

            {/* Company contacts (read-only) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UsersRoundIcon className="size-4 text-muted-foreground" />
                Контакты компании
                {item.company.contacts.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {item.company.contacts.length}
                  </Badge>
                )}
              </div>

              {item.company.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Контактов не добавлено
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {item.company.contacts.map((c) => (
                    <li key={c.id} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium leading-tight">
                          {c.name}
                        </span>
                        {c.position && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5"
                          >
                            {c.position}
                          </Badge>
                        )}
                      </div>
                      {c.contacts && (
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                          {c.contacts}
                        </p>
                      )}
                      {c.description && (
                        <p className="text-xs text-muted-foreground/70 italic">
                          {c.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right column — comments                                              */}
      {/* ------------------------------------------------------------------ */}
      <TodoComments entityType="companyAccount" entityId={item.id} />
    </div>
  )
}
