import '@/components/tiptap/tiptap.css'

import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useRouter } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import {
  ArrowLeftIcon,
  EditIcon,
  Trash2Icon,
  TargetIcon,
  ShieldAlertIcon,
  UsersIcon,
} from 'lucide-react'

import { db } from '@/db'
import { client, todo } from '@/db/schema'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TodoComments } from '@/components/todo-comments'

import { ProfitForecastSection } from '@/components/client-view/profit-forecast-section'
import { RisksSection } from '@/components/client-view/risks-section'
import { UpsellingSection } from '@/components/client-view/upselling-section'
import { ClientTodosSection } from '@/components/client-view/client-todos-section'
import { Section } from '@/components/client-view/shared'

// ---------------------------------------------------------------------------
// Server fn — fetch
// ---------------------------------------------------------------------------

const fetchClient = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const [row, todos] = await Promise.all([
      db.query.client.findFirst({
        where: eq(client.id, data.id),
        with: {
          company: true,
          department: true,
          managers: {
            with: {
              user: { columns: { id: true, name: true, image: true } },
            },
          },
          risks: true,
          grossProfits: true,
          targetForecasts: true,
          upsellingOpportunities: true,
        },
      }),
      db.query.todo.findMany({
        where: eq(todo.clientId, data.id),
        with: {
          responsibleUsers: {
            with: {
              user: { columns: { id: true, name: true } },
            },
          },
        },
      }),
    ])

    if (!row) throw notFound()
    return { ...row, todos }
  })

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/clients_/$id/view')({
  component: RouteComponent,
  loader: async ({ params }) => fetchClient({ data: params }),
})

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()

  const refresh = () => router.invalidate()

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
                {item.target && (
                  <Badge variant="success" className="gap-1 shrink-0">
                    <TargetIcon className="size-3" />
                    Целевой
                  </Badge>
                )}
                {item.lost && (
                  <Badge variant="destructive" className="gap-1 shrink-0">
                    Потерянный
                  </Badge>
                )}
                <h1 className="text-lg font-semibold leading-tight truncate">
                  {item.company.name}
                </h1>
                <span className="text-sm text-muted-foreground truncate">
                  — {item.department.name}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/clients/$id/update" params={{ id: item.id }}>
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
                  <Link to="/clients/$id/delete" params={{ id: item.id }}>
                    <Trash2Icon className="size-4" />
                    Удалить
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Scrollable body */}
          <CardContent className="flex-1 min-h-0 overflow-y-auto pt-4 flex flex-col gap-6">
            {/* Managers */}
            <Section icon={UsersIcon} title="Клиент-менеджеры">
              {item.managers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Менеджеры не назначены
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {item.managers.map(({ user }) => (
                    <Badge key={user.id} variant="secondary">
                      {user.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Section>

            {item.lost && item.lostReasons && (
              <Section icon={ShieldAlertIcon} title="Причина потери">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.lostReasons}
                </p>
              </Section>
            )}

            <Separator />

            {/* Gross profit vs forecast summary */}
            <ProfitForecastSection
              grossProfits={item.grossProfits}
              targetForecasts={item.targetForecasts}
              clientId={item.id}
              onRefresh={refresh}
            />

            <Separator />

            {/* Risks */}
            <RisksSection
              risks={item.risks}
              clientId={item.id}
              onRefresh={refresh}
            />

            <Separator />

            {/* Upselling */}
            <UpsellingSection
              upsellingOpportunities={item.upsellingOpportunities}
              clientId={item.id}
              onRefresh={refresh}
            />

            <Separator />

            {/* Todos */}
            <ClientTodosSection
              todos={item.todos}
              clientId={item.id}
              defaultDepartmentId={item.departmentId}
              onRefresh={refresh}
            />
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right column — comments                                              */}
      {/* ------------------------------------------------------------------ */}
      <TodoComments entityType="client" entityId={item.id} />
    </div>
  )
}
