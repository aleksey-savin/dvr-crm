import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { db } from '@/db'
import {
  clientManager,
  clientGrossProfit,
  clientTargetForecast,
  clientRisk,
  clientUpsellingOpportunity,
  todo,
  todoResponsibleUsers,
  user,
} from '@/db/schema'
import { and, eq, isNull, ne, inArray, count } from 'drizzle-orm'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { EditIcon, EyeIcon, ListTodoIcon, Plus, Trash2Icon } from 'lucide-react'

const fetchClients = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  const nextYear = currentYear + 1

  // Base client data
  const clients = await db.query.client.findMany({
    with: {
      company: { columns: { id: true, name: true } },
      department: { columns: { id: true, name: true } },
      managers: {
        with: {
          user: { columns: { id: true, name: true, role: true } },
        },
      },
    },
    orderBy: (c, { asc }) => [asc(c.id)],
  })

  const clientIds = clients.map((c) => c.id)

  if (clientIds.length === 0) {
    return { clients: [], currentYear, lastYear, nextYear }
  }

  // Gross profit for last year
  const grossProfits = await db
    .select({
      clientId: clientGrossProfit.clientId,
      value: clientGrossProfit.value,
    })
    .from(clientGrossProfit)
    .where(
      and(
        inArray(clientGrossProfit.clientId, clientIds),
        eq(clientGrossProfit.year, lastYear),
      ),
    )

  // Target forecasts for current year
  const forecasts = await db
    .select({
      clientId: clientTargetForecast.clientId,
      value: clientTargetForecast.value,
    })
    .from(clientTargetForecast)
    .where(
      and(
        inArray(clientTargetForecast.clientId, clientIds),
        eq(clientTargetForecast.year, currentYear),
      ),
    )

  // Target forecasts for next year (potential for lost clients)
  const potentialForecasts = await db
    .select({
      clientId: clientTargetForecast.clientId,
      value: clientTargetForecast.value,
    })
    .from(clientTargetForecast)
    .where(
      and(
        inArray(clientTargetForecast.clientId, clientIds),
        eq(clientTargetForecast.year, nextYear),
      ),
    )

  // Risk counts
  const risks = await db
    .select({
      clientId: clientRisk.clientId,
      count: count(clientRisk.id),
    })
    .from(clientRisk)
    .where(inArray(clientRisk.clientId, clientIds))
    .groupBy(clientRisk.clientId)

  // Upselling counts
  const upsellings = await db
    .select({
      clientId: clientUpsellingOpportunity.clientId,
      count: count(clientUpsellingOpportunity.id),
    })
    .from(clientUpsellingOpportunity)
    .where(inArray(clientUpsellingOpportunity.clientId, clientIds))
    .groupBy(clientUpsellingOpportunity.clientId)

  // Active todo counts per client, split by manager role
  // Join: todo → todoResponsibleUsers → user → clientManager
  const todoCounts = await db
    .select({
      clientId: clientManager.clientId,
      userRole: user.role,
      count: count(todo.id),
    })
    .from(todo)
    .innerJoin(todoResponsibleUsers, eq(todo.id, todoResponsibleUsers.todoId))
    .innerJoin(user, eq(todoResponsibleUsers.userId, user.id))
    .innerJoin(clientManager, eq(user.id, clientManager.userId))
    .where(
      and(
        inArray(clientManager.clientId, clientIds),
        ne(todo.status, 'completed'),
        isNull(todo.archivedAt),
      ),
    )
    .groupBy(clientManager.clientId, user.role)

  // Index all results by clientId for O(1) lookup
  const gpByClient = Object.fromEntries(
    grossProfits.map((r) => [r.clientId, r.value]),
  )
  const fcByClient = Object.fromEntries(
    forecasts.map((r) => [r.clientId, r.value]),
  )
  const potentialByClient = Object.fromEntries(
    potentialForecasts.map((r) => [r.clientId, r.value]),
  )
  const risksByClient = Object.fromEntries(
    risks.map((r) => [r.clientId, r.count]),
  )
  const upsellingByClient = Object.fromEntries(
    upsellings.map((r) => [r.clientId, r.count]),
  )

  // Split todo counts into marketolog vs other
  const marketologTodos: Record<string, number> = {}
  const managerTodos: Record<string, number> = {}
  for (const row of todoCounts) {
    if (row.userRole === 'marketolog') {
      marketologTodos[row.clientId] =
        (marketologTodos[row.clientId] ?? 0) + row.count
    } else {
      managerTodos[row.clientId] = (managerTodos[row.clientId] ?? 0) + row.count
    }
  }

  const enriched = clients.map((c) => ({
    ...c,
    gpLastYear: gpByClient[c.id] ?? null,
    forecastCurrentYear: fcByClient[c.id] ?? null,
    potentialNextYear: potentialByClient[c.id] ?? null,
    risksCount: risksByClient[c.id] ?? 0,
    upsellingCount: upsellingByClient[c.id] ?? 0,
    marketologTodosCount: marketologTodos[c.id] ?? 0,
    managerTodosCount: managerTodos[c.id] ?? 0,
  }))

  return { clients: enriched, currentYear, lastYear, nextYear }
})

export const Route = createFileRoute('/clients')({
  component: RouteComponent,
  loader: () => fetchClients(),
})

type EnrichedClient = Awaited<
  ReturnType<typeof fetchClients>
>['clients'][number]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtNum(v: string | null) {
  if (v === null) return <span className="text-muted-foreground">—</span>
  return Number(v).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function CountBadge({
  count,
  variant = 'secondary',
}: {
  count: number
  variant?: 'secondary' | 'destructive' | 'outline'
}) {
  if (count === 0)
    return <span className="text-muted-foreground text-sm">—</span>
  return <Badge variant={variant}>{count}</Badge>
}

// ---------------------------------------------------------------------------
// Action buttons for each row
// ---------------------------------------------------------------------------

function RowActions({ item }: { item: EnrichedClient }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon-sm">
        <Link to="/clients/$id/view" params={{ id: item.id }}>
          <EyeIcon />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon-sm">
        <Link to="/clients/$id/update" params={{ id: item.id }}>
          <EditIcon />
        </Link>
      </Button>
      <Button asChild variant="destructiveGhost" size="icon-sm">
        <Link to="/clients/$id/delete" params={{ id: item.id }}>
          <Trash2Icon />
        </Link>
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function ActiveClientsTable({
  items,
  lastYear,
  currentYear,
}: {
  items: EnrichedClient[]
  lastYear: number
  currentYear: number
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Клиент</TableHead>
          <TableHead>Валовая прибыль {lastYear}</TableHead>
          <TableHead>Цель/Прогноз {currentYear}</TableHead>
          <TableHead>Риски</TableHead>
          <TableHead>Апсейл</TableHead>
          <TableHead>Задачи маркетолога</TableHead>
          <TableHead>Задачи менеджера</TableHead>
          <TableHead>Менеджеры</TableHead>
          <TableHead className="w-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{item.company.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.department.name}
                </span>
              </div>
            </TableCell>
            <TableCell>{fmtNum(item.gpLastYear)}</TableCell>
            <TableCell>{fmtNum(item.forecastCurrentYear)}</TableCell>
            <TableCell>
              <CountBadge
                count={item.risksCount}
                variant={item.risksCount > 0 ? 'destructive' : 'secondary'}
              />
            </TableCell>
            <TableCell>
              <CountBadge count={item.upsellingCount} />
            </TableCell>
            <TableCell>
              <CountBadge count={item.marketologTodosCount} />
            </TableCell>
            <TableCell>
              <CountBadge count={item.managerTodosCount} />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {item.managers.map(({ user }) => (
                  <Badge key={user.id} variant="secondary">
                    {user.name}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <RowActions item={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function LostClientsTable({
  items,
  nextYear,
}: {
  items: EnrichedClient[]
  nextYear: number
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Клиент</TableHead>
          <TableHead>Потенциал на {nextYear}</TableHead>
          <TableHead>Статус прекращения взаимодействия</TableHead>
          <TableHead>Возможности</TableHead>
          <TableHead>Задачи маркетолога</TableHead>
          <TableHead>Задачи менеджера</TableHead>
          <TableHead>Клиентский менеджер</TableHead>
          <TableHead className="w-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{item.company.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.department.name}
                </span>
              </div>
            </TableCell>
            <TableCell>{fmtNum(item.potentialNextYear)}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
              {item.lostReasons || <span className="italic">Не указан</span>}
            </TableCell>
            <TableCell>
              <CountBadge count={item.upsellingCount} />
            </TableCell>
            <TableCell>
              <CountBadge count={item.marketologTodosCount} />
            </TableCell>
            <TableCell>
              <CountBadge count={item.managerTodosCount} />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {item.managers.map(({ user }) => (
                  <Badge key={user.id} variant="secondary">
                    {user.name}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <RowActions item={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  count,
  countVariant = 'secondary',
  children,
}: {
  title: string
  count: number
  countVariant?: 'secondary' | 'destructive'
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {count > 0 && <Badge variant={countVariant}>{count}</Badge>}
      </div>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground italic py-2 px-1">
          Нет клиентов
        </p>
      ) : (
        children
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function RouteComponent() {
  const { clients, currentYear, lastYear, nextYear } = Route.useLoaderData()

  const target = clients.filter((c) => c.target && !c.lost)
  const regular = clients.filter((c) => !c.target && !c.lost)
  const lost = clients.filter((c) => c.lost)

  return (
    <>
      <div className="flex justify-between items-center gap-4 pb-4">
        <Button asChild>
          <Link to="/clients/new" className="flex items-center gap-2">
            <Plus /> Создать
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodoIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет клиентов</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/clients/new" className="flex items-center gap-2">
                <Plus /> Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          <Section title="Целевые клиенты" count={target.length}>
            <ActiveClientsTable
              items={target}
              lastYear={lastYear}
              currentYear={currentYear}
            />
          </Section>

          <Section title="Нецелевые клиенты" count={regular.length}>
            <ActiveClientsTable
              items={regular}
              lastYear={lastYear}
              currentYear={currentYear}
            />
          </Section>

          <Section
            title="Потерянные клиенты"
            count={lost.length}
            countVariant="destructive"
          >
            <LostClientsTable items={lost} nextYear={nextYear} />
          </Section>
        </div>
      )}

      <Outlet />
    </>
  )
}
