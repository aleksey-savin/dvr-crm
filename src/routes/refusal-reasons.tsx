import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { XCircleIcon, PlusIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/refusal-reason-cols'
import { fetchRefusalReasons } from '@/components/refusal-reasons/actions'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { RefusalReasonEntity, RefusalReasonRow } from '@/types'

export const Route = createFileRoute('/refusal-reasons')({
  loader: () => fetchRefusalReasons({ data: {} }),
  component: RouteComponent,
})

const ENTITY_OPTIONS: Array<TableFilterOption<RefusalReasonEntity>> = [
  { value: 'lead', label: 'Лиды' },
  { value: 'tender', label: 'Тендеры' },
  { value: 'signal', label: 'Сигналы' },
]

function RouteComponent() {
  const reasons = Route.useLoaderData()
  const [entityFilter, setEntityFilter] = React.useState<RefusalReasonEntity[]>(
    [],
  )

  const rows: RefusalReasonRow[] = reasons.map((r) => ({
    id: r.id,
    name: r.name,
    entityTypes: r.entityTypes as RefusalReasonEntity[],
    createdAt: new Date(r.createdAt),
  }))

  const filtered =
    entityFilter.length === 0
      ? rows
      : rows.filter((r) => r.entityTypes.some((e) => entityFilter.includes(e)))

  return (
    <>
      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <XCircleIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Причины отказа не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link
                to="/refusal-reasons/new"
                className="flex items-center gap-2"
              >
                <PlusIcon className="size-4" />
                Создать
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
                options={ENTITY_OPTIONS}
                value={entityFilter}
                onValueChange={setEntityFilter}
                placeholder="Сущности"
                emptyText="Не найдены"
              />
              {entityFilter.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEntityFilter([])}
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
