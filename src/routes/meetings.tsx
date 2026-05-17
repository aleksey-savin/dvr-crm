import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { CalendarIcon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/meeting-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchMeetings } from '@/components/meetings/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { MeetingStatus, MeetingType } from '@/types'

export const Route = createFileRoute('/meetings')({
  loader: () => fetchMeetings(),
  component: RouteComponent,
})

const STATUS_OPTIONS: Array<TableFilterOption<MeetingStatus>> = [
  { value: 'scheduled', label: 'Запланированные' },
  { value: 'completed', label: 'Проведённые' },
  { value: 'cancelled', label: 'Отменённые' },
]

const TYPE_OPTIONS: Array<TableFilterOption<MeetingType>> = [
  { value: 'client', label: 'Клиентские' },
  { value: 'internal', label: 'Внутренние' },
]

function RouteComponent() {
  const meetings = Route.useLoaderData()

  const [statusFilter, setStatusFilter] = React.useState<MeetingStatus[]>([])
  const [typeFilter, setTypeFilter] = React.useState<MeetingType[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])

  const responsibleOptions: Array<TableFilterOption> = Array.from(
    new Set(
      meetings
        .map((m) => m.organizerName)
        .filter((n): n is string => n !== null),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const hasFilters =
    statusFilter.length > 0 || typeFilter.length > 0 || responsibleFilter.length > 0

  const filtered = meetings.filter((m) => {
    if (statusFilter.length > 0 && !statusFilter.includes(m.status))
      return false
    if (typeFilter.length > 0 && !typeFilter.includes(m.meetingType))
      return false
    if (
      responsibleFilter.length > 0 &&
      (!m.organizerName || !responsibleFilter.includes(m.organizerName))
    )
      return false
    return true
  })

  return (
    <>
      {meetings.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Встреч пока нет</EmptyDescription>
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

              <MultiFilterCombobox
                options={TYPE_OPTIONS}
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder="Типы"
                emptyText="Типы не найдены"
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
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter([])
                    setTypeFilter([])
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
