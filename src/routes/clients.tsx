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
import {
  columns,
  type ClientAccountStatus,
  type ClientAccountTableRow,
} from '@/components/companyAccounts/client-accounts-cols'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDepartmentStore } from '@/stores/department-store'
import { fetchClients } from '@/components/companyAccounts/actions'
import { InfoIcon } from 'lucide-react'

export const Route = createFileRoute('/clients')({
  component: RouteComponent,
  loader: () => fetchClients(),
})

type StatusFilter = 'all' | ClientAccountStatus
type ManagerFilter = 'all' | 'unassigned' | string

function collectDescendantIds(
  departments: Array<{ id: string; parentId?: string | null }>,
  rootId: string,
): string[] {
  const result = new Set([rootId])
  const queue = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const d of departments) {
      if (d.parentId === current && !result.has(d.id)) {
        result.add(d.id)
        queue.push(d.id)
      }
    }
  }
  return Array.from(result)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function RouteComponent() {
  const { accounts } = Route.useLoaderData()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)
  const departments = useDepartmentStore((s) => s.departments)
  const selectedDept = departments.find((d) => d.id === selectedDepartmentId)

  const canAddClient = React.useMemo(() => {
    if (!selectedDepartmentId) return true
    if (selectedDept?.departmentType === 'sales') return true
    if (selectedDept?.departmentType === 'administrative') {
      const ids = collectDescendantIds(departments, selectedDepartmentId)
      return ids.some((id) => departments.find((d) => d.id === id)?.departmentType === 'sales')
    }
    return false
  }, [selectedDepartmentId, selectedDept, departments])

  const filterIds = React.useMemo(() => {
    if (!selectedDepartmentId) return null
    if (selectedDept?.departmentType === 'administrative') {
      return collectDescendantIds(departments, selectedDepartmentId)
    }
    return [selectedDepartmentId]
  }, [selectedDepartmentId, selectedDept, departments])

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [managerFilter, setManagerFilter] = React.useState<ManagerFilter>('all')

  const filtered = filterIds
    ? accounts.filter((a) => filterIds.includes(a.businessUnitId))
    : accounts

  const toRow = (a: (typeof filtered)[number]): ClientAccountTableRow => ({
    id: a.id,
    companyId: a.company.id,
    name: a.company.name,
    businessUnit: a.businessUnit.name,
    gpLastYear: a.gpLastYear,
    forecastCurrentYear: a.isLost ? a.potentialNextYear : a.forecastCurrentYear,
    lostReasons: a.lostReasons,
    risksCount: a.risksCount,
    upsellingCount: a.upsellingCount,
    marketerTodosCount: a.marketerTodosCount,
    managerTodosCount: a.managerTodosCount,
    managers:
      a.managers.length > 0
        ? a.managers.map(({ user }) => user.name)
        : a.owner
          ? [a.owner.name]
          : [],
    status: a.isLost ? 'lost' : a.isTarget ? 'target' : 'regular',
  })

  const rows = filtered.map(toRow)

  const managers = React.useMemo(() => {
    return Array.from(new Set(rows.flatMap((row) => row.managers))).sort(
      (a, b) => a.localeCompare(b, 'ru'),
    )
  }, [rows])

  const hasUnassigned = rows.some((row) => row.managers.length === 0)

  React.useEffect(() => {
    if (managerFilter === 'all') return
    if (managerFilter === 'unassigned' && hasUnassigned) return
    if (managers.includes(managerFilter)) return

    setManagerFilter('all')
  }, [hasUnassigned, managerFilter, managers])

  const managerFilteredRows =
    managerFilter === 'all'
      ? rows
      : managerFilter === 'unassigned'
        ? rows.filter((row) => row.managers.length === 0)
        : rows.filter((row) => row.managers.includes(managerFilter))

  const targetCount = managerFilteredRows.filter(
    (row) => row.status === 'target',
  ).length
  const regularCount = managerFilteredRows.filter(
    (row) => row.status === 'regular',
  ).length
  const lostCount = managerFilteredRows.filter(
    (row) => row.status === 'lost',
  ).length
  const visibleRows =
    statusFilter === 'all'
      ? managerFilteredRows
      : managerFilteredRows.filter((row) => row.status === statusFilter)

  const rowClassName = (row: ClientAccountTableRow) => {
    if (row.status === 'lost') {
      return 'border-l-2 border-l-red-500/35 bg-red-500/5 hover:bg-red-500/10'
    }

    if (row.status === 'target') {
      return 'border-l-2 border-l-emerald-500/35 bg-emerald-500/5 hover:bg-emerald-500/10'
    }

    return 'border-l-2 border-l-amber-500/35 bg-amber-500/5 hover:bg-amber-500/10'
  }

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
          {canAddClient && (
            <EmptyContent>
              <Button asChild>
                <Link to="/clients/new" className="flex items-center gap-2">
                  <Plus /> Создать
                </Link>
              </Button>
            </EmptyContent>
          )}
          {!canAddClient && (
            <EmptyContent>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <InfoIcon className="size-4 shrink-0" />
                Клиентов можно добавлять только в продающие подразделения
              </p>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {!canAddClient && (
            <p className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              <InfoIcon className="size-4 shrink-0" />
              Клиентов можно добавлять только в продающие подразделения
            </p>
          )}
          <DataTable
            columns={columns}
            data={visibleRows}
            rowClassName={rowClassName}
            toolbar={
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Select
                  value={managerFilter}
                  onValueChange={(value) =>
                    setManagerFilter(value as ManagerFilter)
                  }
                >
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Все менеджеры" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все менеджеры</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager} value={manager}>
                        {manager}
                      </SelectItem>
                    ))}
                    {hasUnassigned && (
                      <SelectItem value="unassigned">Не назначен</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <ToggleGroup
                  type="single"
                  value={statusFilter}
                  onValueChange={(value) => {
                    if (value) setStatusFilter(value as StatusFilter)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="all" className="gap-2">
                    Все{' '}
                    <Badge variant="secondary">
                      {managerFilteredRows.length}
                    </Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="target" className="gap-2">
                    Целевые <Badge variant="secondary">{targetCount}</Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="regular" className="gap-2">
                    Нецелевые <Badge variant="secondary">{regularCount}</Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="lost" className="gap-2">
                    Потерянные <Badge variant="secondary">{lostCount}</Badge>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            }
          />
        </div>
      )}

      <Outlet />
    </>
  )
}
