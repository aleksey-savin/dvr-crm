import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { CalendarDaysIcon, CalendarIcon, Table2Icon, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/meeting-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { fetchMeetings } from '@/components/meetings/actions'
import { fetchMeetingRooms } from '@/components/meeting-rooms/actions'
import { MeetingsCalendar } from '@/components/meetings/meetings-calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { MeetingStatus, MeetingType } from '@/types'

type MeetingsSearch = {
  /** Активное представление; отсутствие значения — таблица. */
  view?: 'calendar'
  /** Якорная дата календаря (YYYY-MM-DD). Без значения — сегодня. */
  week?: string
  /** Масштаб календаря; отсутствие значения — неделя. */
  cal?: 'day' | 'month'
}

export const Route = createFileRoute('/meetings')({
  validateSearch: (search: Record<string, unknown>): MeetingsSearch => ({
    view: search.view === 'calendar' ? 'calendar' : undefined,
    week: typeof search.week === 'string' ? search.week : undefined,
    cal:
      search.cal === 'day' || search.cal === 'month' ? search.cal : undefined,
  }),
  loader: async () => {
    const [meetings, rooms] = await Promise.all([
      fetchMeetings(),
      fetchMeetingRooms(),
    ])
    return { meetings, rooms }
  },
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

function ViewSwitch({ active }: { active: 'table' | 'calendar' }) {
  return (
    <div className="flex w-fit items-center gap-0.5 rounded-lg border p-0.5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn('h-7', active === 'table' && 'bg-secondary')}
      >
        <Link to="/meetings" search={(prev) => ({ ...prev, view: undefined })}>
          <Table2Icon className="size-4" />
          Таблица
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn('h-7', active === 'calendar' && 'bg-secondary')}
      >
        <Link
          to="/meetings"
          search={(prev) => ({ ...prev, view: 'calendar' as const })}
        >
          <CalendarDaysIcon className="size-4" />
          Календарь
        </Link>
      </Button>
    </div>
  )
}

function RouteComponent() {
  const { meetings, rooms } = Route.useLoaderData()
  const { view, week, cal } = Route.useSearch()
  const isCalendar = view === 'calendar'

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
    statusFilter.length > 0 ||
    typeFilter.length > 0 ||
    responsibleFilter.length > 0

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

  if (isCalendar) {
    return (
      <>
        <div className="space-y-3">
          <ViewSwitch active="calendar" />
          <MeetingsCalendar
            meetings={meetings}
            rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
            week={week}
            scale={cal}
          />
        </div>
        <Outlet />
      </>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <ViewSwitch active="table" />
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
      </div>

      <Outlet />
    </>
  )
}
