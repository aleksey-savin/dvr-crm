import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ListTodoIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/companies/companies-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchCompanies } from '@/components/companies/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'

export const Route = createFileRoute('/companies')({
  component: RouteComponent,
  loader: () => fetchCompanies(),
})

const STATUS_OPTIONS: Array<TableFilterOption> = [
  { value: 'wishlist', label: 'Вишлист' },
  { value: 'target', label: 'Целевой' },
  { value: 'regular', label: 'Нецелевой' },
  { value: 'lost', label: 'Потерянный' },
]

function RouteComponent() {
  const items = Route.useLoaderData()

  const [industryFilter, setIndustryFilter] = React.useState<string[]>([])
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])

  const industryOptions: Array<TableFilterOption> = Array.from(
    new Set(
      items.map((c) => c.industry).filter((n): n is string => n !== null),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const filtered = items.filter((c) => {
    if (industryFilter.length > 0 && !industryFilter.includes(c.industry ?? ''))
      return false
    if (statusFilter.length > 0) {
      const matches = statusFilter.some((s) => {
        if (s === 'wishlist') return c.isWishlist
        if (s === 'target') return c.clients.some((cl) => cl.isTarget)
        if (s === 'regular')
          return c.clients.some((cl) => !cl.isTarget && !cl.isLost)
        if (s === 'lost') return c.clients.some((cl) => cl.isLost)
        return false
      })
      if (!matches) return false
    }
    return true
  })

  const hasFilters = statusFilter.length > 0 || industryFilter.length > 0

  return (
    <>
      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodoIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет компаний</EmptyDescription>
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
                placeholder="Статус"
                emptyText="Статусы не найдены"
              />
              {industryOptions.length > 0 && (
                <MultiFilterCombobox
                  options={industryOptions}
                  value={industryFilter}
                  onValueChange={setIndustryFilter}
                  placeholder="Отрасли"
                  emptyText="Отрасли не найдены"
                />
              )}
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter([])
                    setIndustryFilter([])
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
