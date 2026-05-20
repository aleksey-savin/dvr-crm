import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ZapIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { getColumns } from '@/components/tables/lead-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchLeads } from '@/components/leads/actions'
import { fetchPipelines } from '@/components/pipelines/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { LeadStatus } from '@/types'
import { useScopedDepartmentIds, matchesDepartmentScope } from '@/hooks/use-department-scope'

export const Route = createFileRoute('/leads')({
  loader: () => Promise.all([fetchLeads(), fetchPipelines()]),
  component: RouteComponent,
})

const DEFAULT_LEAD_STATUS_FILTER: LeadStatus[] = ['new', 'in_progress']

const STATUS_OPTIONS: Array<TableFilterOption<LeadStatus>> = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'converted', label: 'Конвертирован' },
  { value: 'rejected', label: 'Отклонён' },
]

function RouteComponent() {
  const [allLeads, pipelines] = Route.useLoaderData()
  const scopedDeptIds = useScopedDepartmentIds()
  const leads = allLeads.filter((l) =>
    matchesDepartmentScope(scopedDeptIds, l.departmentId),
  )
  const columns = getColumns(pipelines)

  const [statusFilter, setStatusFilter] = React.useState<LeadStatus[]>(
    DEFAULT_LEAD_STATUS_FILTER,
  )
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [industryFilter, setIndustryFilter] = React.useState<string[]>([])

  const responsibleOptions: Array<TableFilterOption> = Array.from(
    new Set(
      leads
        .map((l) => l.responsibleUserName)
        .filter((n): n is string => n !== null),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const industryOptions: Array<TableFilterOption> = (() => {
    const seen = new Map<string, string>()
    for (const l of leads) {
      if (l.industryId !== null && l.industryName !== null)
        seen.set(l.industryId, l.industryName)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  })()

  const isDefaultStatus =
    statusFilter.length === DEFAULT_LEAD_STATUS_FILTER.length &&
    DEFAULT_LEAD_STATUS_FILTER.every((s) => statusFilter.includes(s))
  const hasFilters = !isDefaultStatus || responsibleFilter.length > 0 || industryFilter.length > 0

  const filtered = leads.filter((l) => {
    if (statusFilter.length > 0 && !statusFilter.includes(l.status)) return false
    if (
      responsibleFilter.length > 0 &&
      (!l.responsibleUserName ||
        !responsibleFilter.includes(l.responsibleUserName))
    )
      return false
    if (
      industryFilter.length > 0 &&
      (!l.industryId || !industryFilter.includes(l.industryId))
    )
      return false
    return true
  })

  return (
    <>
      {leads.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ZapIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Лидов пока нет</EmptyDescription>
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
                    setStatusFilter([...DEFAULT_LEAD_STATUS_FILTER])
                    setResponsibleFilter([])
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
