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
  companyAccount,
  accountGrossProfit,
  accountTargetForecast,
  accountRisk,
  accountUpsellingOpportunity,
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
import type { ClientAccountRow, LostClientAccountRow } from '@/types'

const fetchClients = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  const nextYear = currentYear + 1

  const accounts = await db.query.companyAccount.findMany({
    where: eq(companyAccount.accountType, 'client'),
    with: {
      company: { columns: { id: true, name: true } },
      businessUnit: { columns: { id: true, name: true } },
      owner: { columns: { id: true, name: true } },
    },
    orderBy: (a, { asc }) => [asc(a.id)],
  })

  const accountIds = accounts.map((a) => a.id)

  if (accountIds.length === 0) {
    return { accounts: [], currentYear, lastYear, nextYear }
  }

  const [
    grossProfits,
    forecasts,
    potentialForecasts,
    risks,
    upsellings,
    marketerTodoCounts,
    managerTodoCounts,
  ] = await Promise.all([
    // Gross profit for last year
    db
      .select({
        companyAccountId: accountGrossProfit.companyAccountId,
        value: accountGrossProfit.value,
      })
      .from(accountGrossProfit)
      .where(
        and(
          inArray(accountGrossProfit.companyAccountId, accountIds),
          eq(accountGrossProfit.year, lastYear),
        ),
      ),

    // Target forecasts for current year
    db
      .select({
        companyAccountId: accountTargetForecast.companyAccountId,
        value: accountTargetForecast.value,
      })
      .from(accountTargetForecast)
      .where(
        and(
          inArray(accountTargetForecast.companyAccountId, accountIds),
          eq(accountTargetForecast.year, currentYear),
        ),
      ),

    // Target forecasts for next year (potential for lost clients)
    db
      .select({
        companyAccountId: accountTargetForecast.companyAccountId,
        value: accountTargetForecast.value,
      })
      .from(accountTargetForecast)
      .where(
        and(
          inArray(accountTargetForecast.companyAccountId, accountIds),
          eq(accountTargetForecast.year, nextYear),
        ),
      ),

    // Risk counts
    db
      .select({
        companyAccountId: accountRisk.companyAccountId,
        count: count(accountRisk.id),
      })
      .from(accountRisk)
      .where(inArray(accountRisk.companyAccountId, accountIds))
      .groupBy(accountRisk.companyAccountId),

    // Upselling counts
    db
      .select({
        companyAccountId: accountUpsellingOpportunity.companyAccountId,
        count: count(accountUpsellingOpportunity.id),
      })
      .from(accountUpsellingOpportunity)
      .where(inArray(accountUpsellingOpportunity.companyAccountId, accountIds))
      .groupBy(accountUpsellingOpportunity.companyAccountId),

    // Marketer todos: responsible user has role 'marketer'
    db
      .select({
        companyAccountId: todo.companyAccountId,
        count: countDistinct(todo.id),
      })
      .from(todo)
      .innerJoin(todoResponsibleUsers, eq(todo.id, todoResponsibleUsers.todoId))
      .innerJoin(user, eq(todoResponsibleUsers.userId, user.id))
      .where(
        and(
          isNotNull(todo.companyAccountId),
          inArray(todo.companyAccountId, accountIds),
          ne(todo.status, 'completed'),
          isNull(todo.archivedAt),
          eq(user.role, 'marketer'),
        ),
      )
      .groupBy(todo.companyAccountId),

    // Manager todos: responsible user is the account owner
    db
      .select({
        companyAccountId: todo.companyAccountId,
        count: countDistinct(todo.id),
      })
      .from(todo)
      .innerJoin(todoResponsibleUsers, eq(todo.id, todoResponsibleUsers.todoId))
      .innerJoin(
        companyAccount,
        and(
          eq(todo.companyAccountId, companyAccount.id),
          eq(todoResponsibleUsers.userId, companyAccount.ownerUserId),
        ),
      )
      .where(
        and(
          isNotNull(todo.companyAccountId),
          inArray(todo.companyAccountId, accountIds),
          ne(todo.status, 'completed'),
          isNull(todo.archivedAt),
          isNotNull(companyAccount.ownerUserId),
        ),
      )
      .groupBy(todo.companyAccountId),
  ])

  // Index all results by companyAccountId for O(1) lookup
  const gpByAccount = Object.fromEntries(
    grossProfits.map((r) => [r.companyAccountId, r.value]),
  )
  const fcByAccount = Object.fromEntries(
    forecasts.map((r) => [r.companyAccountId, r.value]),
  )
  const potentialByAccount = Object.fromEntries(
    potentialForecasts.map((r) => [r.companyAccountId, r.value]),
  )
  const risksByAccount = Object.fromEntries(
    risks.map((r) => [r.companyAccountId, r.count]),
  )
  const upsellingByAccount = Object.fromEntries(
    upsellings.map((r) => [r.companyAccountId, r.count]),
  )
  const marketerTodos: Record<string, number> = Object.fromEntries(
    marketerTodoCounts
      .filter((r) => r.companyAccountId !== null)
      .map((r) => [r.companyAccountId!, r.count]),
  )
  const managerTodos: Record<string, number> = Object.fromEntries(
    managerTodoCounts
      .filter((r) => r.companyAccountId !== null)
      .map((r) => [r.companyAccountId!, r.count]),
  )

  const enriched = accounts.map((a) => ({
    ...a,
    gpLastYear: gpByAccount[a.id] ?? null,
    forecastCurrentYear: fcByAccount[a.id] ?? null,
    potentialNextYear: potentialByAccount[a.id] ?? null,
    risksCount: risksByAccount[a.id] ?? 0,
    upsellingCount: upsellingByAccount[a.id] ?? 0,
    marketerTodosCount: marketerTodos[a.id] ?? 0,
    managerTodosCount: managerTodos[a.id] ?? 0,
  }))

  return { accounts: enriched, currentYear, lastYear, nextYear }
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
  const { accounts } = Route.useLoaderData()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const filtered = selectedDepartmentId
    ? accounts.filter((a) => a.businessUnitId === selectedDepartmentId)
    : accounts

  const toActiveRow = (a: (typeof filtered)[number]): ClientAccountRow => ({
    id: a.id,
    name: a.company.name,
    businessUnit: a.businessUnit.name,
    gpLastYear: a.gpLastYear,
    forecastCurrentYear: a.forecastCurrentYear,
    risksCount: a.risksCount,
    upsellingCount: a.upsellingCount,
    marketerTodosCount: a.marketerTodosCount,
    managerTodosCount: a.managerTodosCount,
    owner: a.owner?.name ?? null,
    isTarget: a.isTarget,
    isLost: a.isLost,
  })

  const toLostRow = (a: (typeof filtered)[number]): LostClientAccountRow => ({
    id: a.id,
    name: a.company.name,
    businessUnit: a.businessUnit.name,
    potentialNextYear: a.potentialNextYear,
    lostReasons: a.lostReasons,
    upsellingCount: a.upsellingCount,
    marketerTodosCount: a.marketerTodosCount,
    managerTodosCount: a.managerTodosCount,
    owner: a.owner?.name ?? null,
  })

  const target = filtered
    .filter((a) => a.isTarget && !a.isLost)
    .map(toActiveRow)
  const regular = filtered
    .filter((a) => !a.isTarget && !a.isLost)
    .map(toActiveRow)
  const lost = filtered.filter((a) => a.isLost).map(toLostRow)

  return (
    <>
      {filtered.length === 0 ? (
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
