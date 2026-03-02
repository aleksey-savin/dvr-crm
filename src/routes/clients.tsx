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
import {
  and,
  eq,
  isNull,
  isNotNull,
  ne,
  inArray,
  count,
  countDistinct,
} from 'drizzle-orm'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ListTodoIcon, Plus } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns as activeClientsColumns } from '@/components/tables/active-clients-cols'
import { columns as lostClientsColumns } from '@/components/tables/lost-clients-cols'
import { useDepartmentStore } from '@/stores/department-store'

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

  // Marketer todos: todo.clientId = client.id + responsible user has role 'marketeer'
  const marketerTodoCounts = await db
    .select({
      clientId: todo.clientId,
      count: countDistinct(todo.id),
    })
    .from(todo)
    .innerJoin(todoResponsibleUsers, eq(todo.id, todoResponsibleUsers.todoId))
    .innerJoin(user, eq(todoResponsibleUsers.userId, user.id))
    .where(
      and(
        isNotNull(todo.clientId),
        inArray(todo.clientId, clientIds),
        ne(todo.status, 'completed'),
        isNull(todo.archivedAt),
        eq(user.role, 'marketer'),
      ),
    )
    .groupBy(todo.clientId)

  // Manager todos: todo.clientId = client.id + responsible user is a clientManager of that same client
  const managerTodoCounts = await db
    .select({
      clientId: todo.clientId,
      count: countDistinct(todo.id),
    })
    .from(todo)
    .innerJoin(todoResponsibleUsers, eq(todo.id, todoResponsibleUsers.todoId))
    .innerJoin(
      clientManager,
      and(
        eq(todoResponsibleUsers.userId, clientManager.userId),
        eq(todo.clientId, clientManager.clientId),
      ),
    )
    .where(
      and(
        isNotNull(todo.clientId),
        inArray(todo.clientId, clientIds),
        ne(todo.status, 'completed'),
        isNull(todo.archivedAt),
      ),
    )
    .groupBy(todo.clientId)

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

  // Index todo counts by clientId
  const marketerTodos: Record<string, number> = Object.fromEntries(
    marketerTodoCounts
      .filter((r) => r.clientId !== null)
      .map((r) => [r.clientId!, r.count]),
  )
  const managerTodos: Record<string, number> = Object.fromEntries(
    managerTodoCounts
      .filter((r) => r.clientId !== null)
      .map((r) => [r.clientId!, r.count]),
  )

  const enriched = clients.map((c) => ({
    ...c,
    gpLastYear: gpByClient[c.id] ?? null,
    forecastCurrentYear: fcByClient[c.id] ?? null,
    potentialNextYear: potentialByClient[c.id] ?? null,
    risksCount: risksByClient[c.id] ?? 0,
    upsellingCount: upsellingByClient[c.id] ?? 0,
    marketerTodosCount: marketerTodos[c.id] ?? 0,
    managerTodosCount: managerTodos[c.id] ?? 0,
  }))

  return { clients: enriched, currentYear, lastYear, nextYear }
})

export const Route = createFileRoute('/clients')({
  component: RouteComponent,
  loader: () => fetchClients(),
})

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
        <h2 className="scroll-m-20 pb-1 text-3xl font-semibold first:mt-0">
          {title}
        </h2>
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
  const { clients } = Route.useLoaderData()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const filteredClients = selectedDepartmentId
    ? clients.filter((c) => c.department.id === selectedDepartmentId)
    : clients

  const target = filteredClients
    .filter((c) => c.target && !c.lost)
    .map((c) => ({
      ...c,
      name: c.company.name,
      department: c.department.name,
      managers: c.managers.map((m) => m.user.name),
    }))
  const regular = filteredClients
    .filter((c) => !c.target && !c.lost)
    .map((c) => ({
      ...c,
      name: c.company.name,
      department: c.department.name,
      managers: c.managers.map((m) => m.user.name),
    }))
  const lost = filteredClients
    .filter((c) => c.lost)
    .map((c) => ({
      ...c,
      name: c.company.name,
      department: c.department.name,
      managers: c.managers.map((m) => m.user.name),
    }))

  return (
    <>
      {filteredClients.length === 0 ? (
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
          <Section title="Целевые" count={target.length}>
            <DataTable columns={activeClientsColumns} data={target} />
          </Section>
          <Section title="Нецелевые" count={regular.length}>
            <DataTable columns={activeClientsColumns} data={regular} />
          </Section>
          <Section
            title="Потерянные"
            count={lost.length}
            countVariant="destructive"
          >
            <DataTable columns={lostClientsColumns} data={lost} />
          </Section>
        </div>
      )}

      <Outlet />
    </>
  )
}
