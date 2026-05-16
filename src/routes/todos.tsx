import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ListTodoIcon, Plus, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/todos/todos-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchTodos } from '@/components/todos/actions'
import { useDepartmentStore } from '@/stores/department-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { TodoStatus } from '@/types'

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
  loader: () => fetchTodos(),
})

const STATUS_OPTIONS: Array<TableFilterOption<TodoStatus>> = [
  { value: 'not started', label: 'Не в работе' },
  { value: 'in progress', label: 'В работе' },
  { value: 'completed', label: 'Выполнена' },
]

function RouteComponent() {
  const todos = Route.useLoaderData()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const [statusFilter, setStatusFilter] = React.useState<TodoStatus[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])

  const byDepartment = selectedDepartmentId
    ? todos.filter((t) => t.departmentId === selectedDepartmentId)
    : todos

  const responsibleOptions: Array<TableFilterOption> = Array.from(
    new Set(byDepartment.flatMap((t) => t.responsibles)),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const filtered = byDepartment.filter((t) => {
    if (statusFilter.length > 0 && !statusFilter.includes(t.status))
      return false
    if (
      responsibleFilter.length > 0 &&
      !responsibleFilter.some((r) => t.responsibles.includes(r))
    )
      return false
    return true
  })

  const completedCount = filtered.filter((t) => t.completedAt).length

  return (
    <>
      <div className="flex items-center justify-between gap-4 pb-4">
        <Badge className="p-2 px-4">
          Выполнено {completedCount} из {filtered.length}
        </Badge>
      </div>

      {byDepartment.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodoIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет активных задач</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/todos/new" className="flex items-center gap-2">
                <Plus /> Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <MultiFilterCombobox
                options={STATUS_OPTIONS}
                value={statusFilter}
                onValueChange={setStatusFilter}
                placeholder="Статусы"
                emptyText="Статусы не найдены"
              />
              {responsibleOptions.length > 0 && (
                <MultiFilterCombobox
                  options={responsibleOptions}
                  value={responsibleFilter}
                  onValueChange={setResponsibleFilter}
                  placeholder="Ответственные"
                  emptyText="Ответственные не найдены"
                />
              )}
              {(statusFilter.length > 0 || responsibleFilter.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter([])
                    setResponsibleFilter([])
                  }}
                >
                  <XIcon className="size-4" />
                  Сбросить
                </Button>
              )}
            </div>
          }
        />
      )}

      <Outlet />
    </>
  )
}
