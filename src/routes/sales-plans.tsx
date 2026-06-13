import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { LandmarkIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/sales-plan-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchSalesPlans } from '@/components/reports/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'

export const Route = createFileRoute('/sales-plans')({
  loader: () => fetchSalesPlans({ data: {} }),
  component: RouteComponent,
})

function RouteComponent() {
  const plans = Route.useLoaderData()
  const [yearFilter, setYearFilter] = React.useState<string[]>([])

  const yearOptions: Array<TableFilterOption> = Array.from(
    new Set(plans.map((p) => String(p.year))),
  )
    .sort((a, b) => Number(b) - Number(a))
    .map((y) => ({ value: y, label: y }))

  const filtered =
    yearFilter.length === 0
      ? plans
      : plans.filter((p) => yearFilter.includes(String(p.year)))

  return (
    <>
      {plans.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LandmarkIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Планы продаж ещё не заданы</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/sales-plans/new">Создать</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          toolbar={
            yearOptions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <MultiFilterCombobox
                  options={yearOptions}
                  value={yearFilter}
                  onValueChange={setYearFilter}
                  placeholder="Год"
                  emptyText="Годы не найдены"
                />
                {yearFilter.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setYearFilter([])}
                  >
                    <XIcon className="size-4" />
                    Сбросить
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />
      )}

      <Outlet />
    </>
  )
}
