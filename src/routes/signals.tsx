import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RadioIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { signalColumns } from '@/components/tables/signal-cols'
import { usePipelinesStore } from '@/stores/pipelines-store'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchSignals } from '@/components/signals/actions'
import { fetchPipelines } from '@/components/pipelines/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { SignalStatus } from '@/types'
import {
  useScopedDepartmentIds,
  matchesDepartmentScope,
} from '@/hooks/use-department-scope'

export const Route = createFileRoute('/signals')({
  loader: () => Promise.all([fetchSignals(), fetchPipelines()]),
  component: RouteComponent,
})

const STATUS_OPTIONS: Array<TableFilterOption<SignalStatus>> = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'converted', label: 'Конвертирован' },
  { value: 'archived', label: 'Архив' },
]

function RouteComponent() {
  const [allSignals, pipelines] = Route.useLoaderData()
  const setPipelines = usePipelinesStore((s) => s.setPipelines)
  React.useEffect(() => {
    setPipelines(pipelines)
  }, [pipelines, setPipelines])
  const scopedDeptIds = useScopedDepartmentIds()
  const signals = allSignals.filter((s) =>
    matchesDepartmentScope(scopedDeptIds, s.departmentId),
  )

  const [statusFilter, setStatusFilter] = React.useState<SignalStatus[]>([])
  const [typeFilter, setTypeFilter] = React.useState<string[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [industryFilter, setIndustryFilter] = React.useState<string[]>([])

  const responsibleOptions: Array<TableFilterOption> = Array.from(
    new Set(
      signals
        .map((s) => s.responsibleUserName)
        .filter((n): n is string => n !== null),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const industryOptions: Array<TableFilterOption> = (() => {
    const seen = new Map<string, string>()
    for (const s of signals) {
      if (s.industryId !== null && s.industryName !== null)
        seen.set(s.industryId, s.industryName)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  })()

  const typeOptions: Array<TableFilterOption> = (() => {
    const seen = new Map<string, string>()
    for (const s of signals) {
      if (s.signalTypeId !== null && s.signalTypeName !== null)
        seen.set(s.signalTypeId, s.signalTypeName)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  })()

  const hasFilters =
    statusFilter.length > 0 ||
    typeFilter.length > 0 ||
    responsibleFilter.length > 0 ||
    industryFilter.length > 0

  const filtered = signals.filter((s) => {
    if (statusFilter.length > 0 && !statusFilter.includes(s.status))
      return false
    if (
      typeFilter.length > 0 &&
      (!s.signalTypeId || !typeFilter.includes(s.signalTypeId))
    )
      return false
    if (
      responsibleFilter.length > 0 &&
      (!s.responsibleUserName ||
        !responsibleFilter.includes(s.responsibleUserName))
    )
      return false
    if (
      industryFilter.length > 0 &&
      (!s.industryId || !industryFilter.includes(s.industryId))
    )
      return false
    return true
  })

  return (
    <>
      {signals.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RadioIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Сигналов пока нет</EmptyDescription>
        </Empty>
      ) : (
        <DataTable
          columns={signalColumns}
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

              {typeOptions.length > 0 && (
                <MultiFilterCombobox
                  options={typeOptions}
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                  placeholder="Типы"
                  emptyText="Типы не найдены"
                />
              )}

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
                    setStatusFilter([])
                    setTypeFilter([])
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
