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

import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ListTodoIcon, Plus } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns as activeClientsColumns } from '@/components/tables/active-clients-cols'
import { columns as lostClientsColumns } from '@/components/tables/lost-clients-cols'
import { useDepartmentStore } from '@/stores/department-store'
import type { ClientAccountRow, LostClientAccountRow } from '@/types'
import { fetchClients } from '@/components/accounts/actions'

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
