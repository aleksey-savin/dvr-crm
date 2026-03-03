import * as React from 'react'
import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import {
  ArrowLeftIcon,
  EditIcon,
  Trash2Icon,
  UsersIcon,
  InfoIcon,
  HeartIcon,
  ListTodoIcon,
  UsersRoundIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  ExternalLinkIcon,
} from 'lucide-react'

import { db } from '@/db'
import { wishlistClient } from '@/db/schema'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TodoComments } from '@/components/todo-comments'
import { Section } from '@/components/client-view/shared'
import { RevenueSection } from '@/components/company-view/revenue-section'
import { HooksSection } from '@/components/wishlist-view/hooks-section'

// ---------------------------------------------------------------------------
// Server fn
// ---------------------------------------------------------------------------

const fetchWishlistClient = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const row = await db.query.wishlistClient.findFirst({
      where: eq(wishlistClient.id, data.id),
      with: {
        company: {
          with: {
            revenues: true,
            contacts: true,
          },
        },
        departments: {
          with: {
            department: { columns: { id: true, name: true } },
          },
        },
        hooks: true,
        todos: {
          with: {
            responsibleUsers: {
              with: {
                user: { columns: { id: true, name: true } },
              },
            },
          },
        },
        responsibleUsers: {
          with: {
            user: { columns: { id: true, name: true } },
          },
        },
      },
    })

    if (!row) throw notFound()
    return row
  })

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

type TodoStatus = 'not started' | 'in progress' | 'completed'

const statusConfig: Record<
  TodoStatus,
  {
    label: string
    variant: 'warning' | 'default' | 'success'
    Icon: React.ElementType
  }
> = {
  'not started': {
    label: 'Не в работе',
    variant: 'warning',
    Icon: CircleDashedIcon,
  },
  'in progress': { label: 'В работе', variant: 'default', Icon: ClockIcon },
  completed: { label: 'Выполнена', variant: 'success', Icon: CheckCircle2Icon },
}

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const isOverdue = (deadline: Date | string, status: TodoStatus) => {
  if (status === 'completed') return false
  return new Date(deadline) < new Date()
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()
  const [showCompletedTodos, setShowCompletedTodos] = React.useState(false)

  const refresh = () => router.invalidate()

  const activeTodos = item.todos.filter(
    (t) => !t.archivedAt && t.status !== 'completed',
  )
  const completedTodos = item.todos.filter(
    (t) => !t.archivedAt && t.status === 'completed',
  )

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
                {item.departments.map(({ department }) => (
                  <Badge
                    key={department.id}
                    variant="secondary"
                    className="shrink-0"
                  >
                    {department.name}
                  </Badge>
                ))}
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
            <Section icon={UsersIcon} title="Ответственные">
              {item.responsibleUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Ответственные не назначены
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {item.responsibleUsers.map(({ user }) => (
                    <Badge key={user.id} variant="secondary">
                      {user.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Section>

            {/* Industry */}
            {item.industry && (
              <Section icon={InfoIcon} title="Отрасль">
                <p className="text-sm text-muted-foreground">{item.industry}</p>
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ListTodoIcon className="size-4 text-muted-foreground" />
                Задачи
                {activeTodos.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {activeTodos.length}
                  </Badge>
                )}
              </div>

              {item.todos.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Задач нет
                </p>
              ) : (
                <div className="flex flex-col divide-y">
                  {activeTodos.map((t) => {
                    const cfg =
                      statusConfig[t.status as TodoStatus] ??
                      statusConfig['not started']
                    const { Icon: StatusIcon } = cfg
                    const overdue = isOverdue(
                      t.deadline,
                      t.status as TodoStatus,
                    )
                    return (
                      <div
                        key={t.id}
                        className="flex items-start gap-3 py-2.5 group"
                      >
                        <StatusIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium leading-snug truncate">
                              {t.name}
                            </span>
                            <Badge
                              variant={cfg.variant}
                              className="h-4 px-1.5 text-[10px] shrink-0"
                            >
                              {cfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span
                              className={`flex items-center gap-1 ${overdue ? 'text-destructive font-medium' : ''}`}
                            >
                              <CalendarIcon className="size-3" />
                              {fmtDate(t.deadline)}
                              {overdue && ' (просрочена)'}
                            </span>
                            {t.responsibleUsers.length > 0 && (
                              <span>
                                {t.responsibleUsers
                                  .map((r) => r.user.name)
                                  .join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground"
                        >
                          <Link to="/todos/$id/view" params={{ id: t.id }}>
                            <ExternalLinkIcon className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )
                  })}

                  {completedTodos.length > 0 && (
                    <>
                      {activeTodos.length > 0 && <Separator className="my-1" />}
                      <button
                        type="button"
                        onClick={() => setShowCompletedTodos((v) => !v)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 text-left w-fit"
                      >
                        <CheckCircle2Icon className="size-3.5" />
                        {showCompletedTodos
                          ? 'Скрыть выполненные'
                          : `Показать выполненные (${completedTodos.length})`}
                      </button>

                      {showCompletedTodos && (
                        <div className="flex flex-col divide-y opacity-60">
                          {completedTodos.map((t) => {
                            const cfg = statusConfig['completed']
                            const { Icon: StatusIcon } = cfg
                            return (
                              <div
                                key={t.id}
                                className="flex items-start gap-3 py-2.5 group"
                              >
                                <StatusIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <span className="text-sm font-medium leading-snug truncate text-muted-foreground line-through">
                                    {t.name}
                                  </span>
                                  {t.responsibleUsers.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {t.responsibleUsers
                                        .map((r) => r.user.name)
                                        .join(', ')}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="icon-sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground"
                                >
                                  <Link
                                    to="/todos/$id/view"
                                    params={{ id: t.id }}
                                  >
                                    <ExternalLinkIcon className="size-3.5" />
                                  </Link>
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

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
      <TodoComments entityType="wishlistClient" entityId={item.id} />
    </div>
  )
}
