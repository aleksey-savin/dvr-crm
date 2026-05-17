import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { TargetIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/target-action-type-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchTargetActionTypes } from '@/components/target-action-types/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'

export const Route = createFileRoute('/target-action-types')({
  loader: () => fetchTargetActionTypes(),
  component: RouteComponent,
})

const TYPE_OPTIONS: Array<TableFilterOption> = [
  { value: 'true', label: 'Системные' },
  { value: 'false', label: 'Пользовательские' },
]

function RouteComponent() {
  const types = Route.useLoaderData()

  const [typeFilter, setTypeFilter] = React.useState<string[]>([])

  const filtered = types.filter((t) => {
    if (typeFilter.length > 0 && !typeFilter.includes(String(t.isSystem)))
      return false
    return true
  })

  return (
    <>
      {types.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TargetIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Типы ЦД не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/target-action-types/new">Создать</Link>
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
                options={TYPE_OPTIONS}
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder="Тип"
                emptyText="Типы не найдены"
              />
              {typeFilter.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTypeFilter([])}
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
