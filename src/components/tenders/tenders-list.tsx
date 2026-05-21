import * as React from 'react'
import { FileTextIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/tender-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { TenderRow, TenderStatus } from '@/types'
import {
  useScopedDepartmentIds,
  matchesDepartmentScope,
} from '@/hooks/use-department-scope'

const STATUS_OPTIONS: Array<TableFilterOption<TenderStatus>> = [
  { value: 'new', label: 'Новый' },
  { value: 'evaluation', label: 'Оценка' },
  { value: 'approval', label: 'Согласование' },
  { value: 'preparation', label: 'Подготовка' },
  { value: 'submitted', label: 'Подан' },
  { value: 'won', label: 'Выигран' },
  { value: 'lost', label: 'Проигран' },
  { value: 'rejected', label: 'Отклонён' },
  { value: 'archived', label: 'Архив' },
]

export function TendersList({ tenders: allTenders }: { tenders: TenderRow[] }) {
  const scopedDeptIds = useScopedDepartmentIds()

  const tenders = allTenders.filter((t) =>
    matchesDepartmentScope(scopedDeptIds, t.departmentId),
  )

  const [statusFilter, setStatusFilter] = React.useState<TenderStatus[]>([])
  const [departmentFilter, setDepartmentFilter] = React.useState<string[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [industryFilter, setIndustryFilter] = React.useState<string[]>([])

  const departmentOptions: Array<TableFilterOption> = (() => {
    const seen = new Map<string, string>()
    for (const t of tenders) {
      if (t.departmentId !== null && t.departmentName !== null)
        seen.set(t.departmentId, t.departmentName)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  })()

  const responsibleOptions: Array<TableFilterOption> = Array.from(
    new Set(
      tenders
        .map((t) => t.responsibleUserName)
        .filter((n): n is string => n !== null),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const industryOptions: Array<TableFilterOption> = (() => {
    const seen = new Map<string, string>()
    for (const t of tenders) {
      if (t.industryId !== null && t.industryName !== null)
        seen.set(t.industryId, t.industryName)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  })()

  const hasFilters =
    statusFilter.length > 0 ||
    departmentFilter.length > 0 ||
    responsibleFilter.length > 0 ||
    industryFilter.length > 0

  const filtered = tenders.filter((t) => {
    if (statusFilter.length > 0 && !statusFilter.includes(t.status))
      return false
    if (
      departmentFilter.length > 0 &&
      (!t.departmentId || !departmentFilter.includes(t.departmentId))
    )
      return false
    if (
      responsibleFilter.length > 0 &&
      (!t.responsibleUserName ||
        !responsibleFilter.includes(t.responsibleUserName))
    )
      return false
    if (
      industryFilter.length > 0 &&
      (!t.industryId || !industryFilter.includes(t.industryId))
    )
      return false
    return true
  })

  if (tenders.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
        </EmptyHeader>
        <EmptyDescription>Тендеров пока нет</EmptyDescription>
      </Empty>
    )
  }

  return (
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

          {departmentOptions.length > 0 && (
            <MultiFilterCombobox
              options={departmentOptions}
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
              placeholder="Подразделения"
              emptyText="Подразделения не найдены"
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
                setDepartmentFilter([])
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
  )
}
