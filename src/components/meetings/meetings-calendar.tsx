import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MeetingRow, MeetingRoomOption } from '@/types'

// ---------------------------------------------------------------------------
// Week helpers (shared with the meeting peek panel)
// ---------------------------------------------------------------------------

export function getMonday(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay() // 0 — воскресенье
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  return date
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Якорная дата календаря из search-параметра `week` (или сегодня). */
export function resolveAnchor(week?: string): Date {
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) {
    const parsed = new Date(`${week}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1)
}

// ---------------------------------------------------------------------------
// Grid constants & formatting
// ---------------------------------------------------------------------------

const START_HOUR = 8
const END_HOUR = 20
const HOUR_PX = 64
const GRID_MINUTES = (END_HOUR - START_HOUR) * 60
const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX
const DEFAULT_SLOT_MS = 60 * 60 * 1000

/** Ключ-фильтр для встреч без переговорки. */
const NO_ROOM = '__no_room__'

/** Сколько встреч показывает ячейка месяца до кнопки «ещё N». */
const MONTH_CELL_EVENTS = 3

const SCALE_OPTIONS: Array<{ value: 'day' | 'week' | 'month'; label: string }> =
  [
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
  ]

const PREV_LABELS = {
  day: 'Предыдущий день',
  week: 'Предыдущая неделя',
  month: 'Предыдущий месяц',
} as const

const NEXT_LABELS = {
  day: 'Следующий день',
  week: 'Следующая неделя',
  month: 'Следующий месяц',
} as const

const dayNameFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
const dayMonthFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
})
const dayTitleFmt = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const monthTitleFmt = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const sameMonth = monday.getMonth() === sunday.getMonth()
  const left = sameMonth ? String(monday.getDate()) : dayMonthFmt.format(monday)
  return `${left} — ${dayMonthFmt.format(sunday)} ${sunday.getFullYear()}`
}

type EventColor = {
  dot: string
  event: string
  time: string
}

/** Палитра переговорок: полные литералы классов, чтобы Tailwind их увидел. */
const ROOM_COLORS: EventColor[] = [
  {
    dot: 'bg-sky-500',
    event: 'border-sky-500 bg-sky-500/10 hover:bg-sky-500/20',
    time: 'text-sky-700 dark:text-sky-300',
  },
  {
    dot: 'bg-emerald-500',
    event: 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20',
    time: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    dot: 'bg-amber-500',
    event: 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/20',
    time: 'text-amber-700 dark:text-amber-300',
  },
  {
    dot: 'bg-violet-500',
    event: 'border-violet-500 bg-violet-500/10 hover:bg-violet-500/20',
    time: 'text-violet-700 dark:text-violet-300',
  },
  {
    dot: 'bg-rose-500',
    event: 'border-rose-500 bg-rose-500/10 hover:bg-rose-500/20',
    time: 'text-rose-700 dark:text-rose-300',
  },
  {
    dot: 'bg-cyan-500',
    event: 'border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20',
    time: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    dot: 'bg-orange-500',
    event: 'border-orange-500 bg-orange-500/10 hover:bg-orange-500/20',
    time: 'text-orange-700 dark:text-orange-300',
  },
  {
    dot: 'bg-indigo-500',
    event: 'border-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20',
    time: 'text-indigo-700 dark:text-indigo-300',
  },
]

/** Нейтральный цвет для встреч без брони переговорки. */
const NO_ROOM_COLOR: EventColor = {
  dot: 'bg-zinc-400',
  event: 'border-zinc-400 bg-zinc-400/10 hover:bg-zinc-400/20',
  time: 'text-zinc-600 dark:text-zinc-300',
}

// ---------------------------------------------------------------------------
// Overlap layout: пересекающиеся события делят ширину колонки дня
// ---------------------------------------------------------------------------

type DayEvent = {
  meeting: MeetingRow
  startsAt: Date
  endsAt: Date
  startMin: number
  endMin: number
}

type PositionedEvent = DayEvent & { col: number; cols: number }

function layoutDayEvents(events: DayEvent[]): PositionedEvent[] {
  const sorted = [...events].sort(
    (a, b) => a.startMin - b.startMin || b.endMin - a.endMin,
  )
  const result: PositionedEvent[] = []
  let cluster: PositionedEvent[] = []
  let columnEnds: number[] = []
  let clusterMaxEnd = -1

  const flush = () => {
    for (const ev of cluster) ev.cols = columnEnds.length
    result.push(...cluster)
    cluster = []
    columnEnds = []
    clusterMaxEnd = -1
  }

  for (const item of sorted) {
    if (cluster.length > 0 && item.startMin >= clusterMaxEnd) flush()
    let col = columnEnds.findIndex((end) => end <= item.startMin)
    if (col === -1) {
      col = columnEnds.length
      columnEnds.push(item.endMin)
    } else {
      columnEnds[col] = item.endMin
    }
    cluster.push({ ...item, col, cols: 0 })
    clusterMaxEnd = Math.max(clusterMaxEnd, item.endMin)
  }
  flush()
  return result
}

function effectiveEnd(meeting: MeetingRow): Date {
  const start = new Date(meeting.scheduledAt)
  const end = meeting.endedAt ? new Date(meeting.endedAt) : null
  return end && end.getTime() > start.getTime()
    ? end
    : new Date(start.getTime() + DEFAULT_SLOT_MS)
}

function locationLabel(meeting: MeetingRow): string {
  if (meeting.meetingRoomName) return meeting.meetingRoomName
  return meeting.locationType === 'client_site' ? 'У клиента' : 'Офис'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Масштаб календаря в search-параметре `cal`; отсутствие — неделя. */
export type CalendarScale = 'day' | 'month'

type CalendarMode = 'day' | 'week' | 'month'

type Props = {
  meetings: MeetingRow[]
  rooms: MeetingRoomOption[]
  week?: string
  scale?: CalendarScale
}

export function MeetingsCalendar({ meetings, rooms, week, scale }: Props) {
  const navigate = useNavigate()
  const mode: CalendarMode = scale ?? 'week'
  const anchor = React.useMemo(() => resolveAnchor(week), [week])
  const monday = React.useMemo(() => getMonday(anchor), [anchor])
  const monthStart = React.useMemo(() => firstOfMonth(anchor), [anchor])

  // Якорь, который уходит в search при переходах «создать/вернуться».
  const anchorIso = toISODate(
    mode === 'day' ? anchor : mode === 'month' ? monthStart : monday,
  )

  // Колонки часовой сетки: один день или неделя.
  const days = React.useMemo(
    () =>
      mode === 'day'
        ? [anchor]
        : Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [mode, anchor, monday],
  )

  // Дни месячной сетки: с понедельника недели 1-го числа по воскресенье
  // недели последнего числа.
  const monthDays = React.useMemo(() => {
    if (mode !== 'month') return []
    const gridStart = getMonday(monthStart)
    const monthEnd = addMonths(monthStart, 1)
    const result: Date[] = []
    for (
      let d = gridStart;
      d < monthEnd || result.length % 7 !== 0;
      d = addDays(d, 1)
    ) {
      result.push(d)
    }
    return result
  }, [mode, monthStart])

  // Цвет закрепляется за переговоркой по её позиции в справочнике.
  const roomColor = React.useMemo(() => {
    const map = new Map<string, EventColor>()
    rooms.forEach((room, i) => {
      map.set(room.id, ROOM_COLORS[i % ROOM_COLORS.length])
    })
    return map
  }, [rooms])

  // Фильтр: скрытые группы (переговорки + «без переговорки»). Видны все.
  const [hiddenKeys, setHiddenKeys] = React.useState<Set<string>>(
    () => new Set(),
  )
  const toggleKey = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const visibleRooms = rooms.filter((r) => !hiddenKeys.has(r.id))
  // Комната для предзаполнения из клика по слоту: ровно одна видимая
  // переговорка и скрытые «без переговорки» — иначе не угадываем.
  const slotRoomId =
    visibleRooms.length === 1 && hiddenKeys.has(NO_ROOM)
      ? visibleRooms[0].id
      : undefined

  // В календаре участвуют активные и проведённые встречи видимого диапазона.
  const rangeEvents = React.useMemo(() => {
    const gridDays = mode === 'month' ? monthDays : days
    const rangeStart = gridDays[0]
    const rangeEnd = addDays(gridDays[gridDays.length - 1], 1)
    return meetings.filter((m) => {
      if (m.status !== 'scheduled' && m.status !== 'completed') return false
      if (hiddenKeys.has(m.meetingRoomId ?? NO_ROOM)) return false
      const start = new Date(m.scheduledAt)
      return start < rangeEnd && effectiveEnd(m) > rangeStart
    })
  }, [meetings, mode, days, monthDays, hiddenKeys])

  // Месяц: встречи группируются по дню начала.
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, MeetingRow[]>()
    if (mode !== 'month') return map
    for (const m of rangeEvents) {
      const iso = toISODate(new Date(m.scheduledAt))
      const list = map.get(iso)
      if (list) list.push(m)
      else map.set(iso, [m])
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      )
    }
    return map
  }, [mode, rangeEvents])

  // Линия текущего времени появляется после монтирования (SSR-safe).
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const goToDate = (target: Date | null) => {
    void navigate({
      to: '/meetings',
      search: (prev) => ({
        ...prev,
        week: target ? toISODate(target) : undefined,
      }),
    })
  }

  const shiftPeriod = (dir: -1 | 1) => {
    const target =
      mode === 'day'
        ? addDays(anchor, dir)
        : mode === 'month'
          ? addMonths(monthStart, dir)
          : addDays(monday, dir * 7)
    goToDate(target)
  }

  const setScale = (next: CalendarMode) => {
    void navigate({
      to: '/meetings',
      search: (prev) => ({
        ...prev,
        cal: next === 'week' ? undefined : next,
      }),
    })
  }

  /** Переход в режим «День» на конкретную дату (из месячной сетки). */
  const openDay = (day: Date) => {
    void navigate({
      to: '/meetings',
      search: (prev) => ({ ...prev, cal: 'day', week: toISODate(day) }),
    })
  }

  const handleSlotClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetMin = ((e.clientY - rect.top) / HOUR_PX) * 60
    const snapped =
      START_HOUR * 60 + Math.max(0, Math.floor(offsetMin / 30) * 30)
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${toISODate(day)}T${pad(Math.floor(snapped / 60))}:${pad(snapped % 60)}`
    void navigate({
      to: '/meetings/new',
      search: {
        start,
        room: slotRoomId,
        view: 'calendar',
        cal: scale,
        week: anchorIso,
      },
    })
  }

  /** Клик по дню месячной сетки — встреча на утро этого дня. */
  const handleMonthDayClick = (day: Date) => {
    void navigate({
      to: '/meetings/new',
      search: {
        start: `${toISODate(day)}T09:00`,
        room: slotRoomId,
        view: 'calendar',
        cal: 'month',
        week: anchorIso,
      },
    })
  }

  const eventsByDay = React.useMemo(() => {
    return days.map((day) => {
      const dayStart = new Date(day)
      dayStart.setHours(START_HOUR, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(END_HOUR, 0, 0, 0)

      const dayEvents: DayEvent[] = []
      for (const meeting of rangeEvents) {
        const startsAt = new Date(meeting.scheduledAt)
        const endsAt = effectiveEnd(meeting)
        if (endsAt <= dayStart || startsAt >= dayEnd) continue
        const clampedStart = startsAt < dayStart ? dayStart : startsAt
        const clampedEnd = endsAt > dayEnd ? dayEnd : endsAt
        dayEvents.push({
          meeting,
          startsAt,
          endsAt,
          startMin: (clampedStart.getTime() - dayStart.getTime()) / 60_000,
          endMin: (clampedEnd.getTime() - dayStart.getTime()) / 60_000,
        })
      }
      return layoutDayEvents(dayEvents)
    })
  }, [days, rangeEvents])

  const todayIso = now ? toISODate(now) : null
  const nowMin = now
    ? now.getHours() * 60 + now.getMinutes() - START_HOUR * 60
    : null
  const showNowLine = nowMin !== null && nowMin >= 0 && nowMin <= GRID_MINUTES

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  )

  const timeGridCols =
    mode === 'day' ? 'grid-cols-[56px_1fr]' : 'grid-cols-[56px_repeat(7,1fr)]'

  return (
    <div className="space-y-3">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shiftPeriod(-1)}
            aria-label={PREV_LABELS[mode]}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shiftPeriod(1)}
            aria-label={NEXT_LABELS[mode]}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-1"
            onClick={() => goToDate(null)}
          >
            Сегодня
          </Button>
        </div>

        <div className="flex w-fit items-center gap-0.5 rounded-lg border p-0.5">
          {SCALE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-7 px-2.5', mode === opt.value && 'bg-secondary')}
              onClick={() => setScale(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <h2 className="text-base font-semibold tabular-nums">
          {mode === 'day'
            ? capitalize(dayTitleFmt.format(anchor))
            : mode === 'month'
              ? capitalize(monthTitleFmt.format(monthStart))
              : formatWeekLabel(monday)}
        </h2>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {rooms.length > 0 && (
            <>
              {rooms.map((room) => {
                const color = roomColor.get(room.id)!
                const hidden = hiddenKeys.has(room.id)
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggleKey(room.id)}
                    aria-pressed={!hidden}
                    title={
                      hidden
                        ? `Показать «${room.name}»`
                        : `Скрыть «${room.name}»`
                    }
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-opacity hover:bg-accent',
                      hidden && 'opacity-40',
                    )}
                  >
                    <span className={cn('size-2.5 rounded-full', color.dot)} />
                    {room.name}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => toggleKey(NO_ROOM)}
                aria-pressed={!hiddenKeys.has(NO_ROOM)}
                title={
                  hiddenKeys.has(NO_ROOM)
                    ? 'Показать встречи без переговорки'
                    : 'Скрыть встречи без переговорки'
                }
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-opacity hover:bg-accent',
                  hiddenKeys.has(NO_ROOM) && 'opacity-40',
                )}
              >
                <span
                  className={cn('size-2.5 rounded-full', NO_ROOM_COLOR.dot)}
                />
                Без переговорки
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Часовая сетка: день и неделя ────────────────────────────────── */}
      {mode !== 'month' && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <div className={cn(mode === 'week' && 'min-w-[880px]')}>
            {/* Day headers */}
            <div className={cn('grid border-b', timeGridCols)}>
              <div />
              {days.map((day) => {
                const isToday = todayIso === toISODate(day)
                return (
                  <div
                    key={day.toISOString()}
                    className="flex items-baseline gap-1.5 border-l px-2 py-2"
                  >
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {dayNameFmt.format(day)}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium tabular-nums',
                        isToday &&
                          'flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground',
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div
              className={cn('relative grid', timeGridCols)}
              style={{ height: GRID_HEIGHT }}
            >
              {/* Hour lines (full width, behind the columns) */}
              {hours.slice(1, -1).map((h) => (
                <div
                  key={h}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 border-t border-border/70"
                  style={{ top: (h - START_HOUR) * HOUR_PX }}
                />
              ))}
              {hours.slice(0, -1).map((h) => (
                <div
                  key={`${h}-half`}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/40"
                  style={{ top: (h - START_HOUR) * HOUR_PX + HOUR_PX / 2 }}
                />
              ))}

              {/* Time gutter: метка часа стоит сразу под своей линией */}
              <div className="relative">
                {hours.slice(0, -1).map((h) => (
                  <span
                    key={h}
                    className="absolute right-2 text-[10px] tabular-nums text-muted-foreground"
                    style={{ top: (h - START_HOUR) * HOUR_PX + 3 }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, dayIdx) => {
                const isToday = todayIso === toISODate(day)
                const dow = day.getDay()
                const isWeekend = dow === 0 || dow === 6
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'relative cursor-pointer border-l',
                      isWeekend && 'bg-muted/40',
                      isToday && 'bg-primary/5',
                    )}
                    onClick={(e) => handleSlotClick(day, e)}
                    title="Создать встречу в этом слоте"
                  >
                    {eventsByDay[dayIdx].map((ev) => {
                      const color = ev.meeting.meetingRoomId
                        ? (roomColor.get(ev.meeting.meetingRoomId) ??
                          NO_ROOM_COLOR)
                        : NO_ROOM_COLOR
                      const heightPx = Math.max(
                        ((ev.endMin - ev.startMin) / 60) * HOUR_PX - 2,
                        22,
                      )
                      const compact = heightPx < 48
                      const isCompleted = ev.meeting.status === 'completed'
                      return (
                        <button
                          key={ev.meeting.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void navigate({
                              to: '/meetings/$id/view',
                              params: { id: ev.meeting.id },
                              search: (prev) => prev,
                            })
                          }}
                          title={`${ev.meeting.title} · ${locationLabel(ev.meeting)}\n${timeFmt.format(ev.startsAt)} — ${timeFmt.format(ev.endsAt)}`}
                          className={cn(
                            'absolute z-10 flex flex-col overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-sm transition-colors',
                            color.event,
                            isCompleted && 'opacity-70',
                          )}
                          style={{
                            top: (ev.startMin / 60) * HOUR_PX + 1,
                            height: heightPx,
                            left: `calc(${(ev.col / ev.cols) * 100}% + 2px)`,
                            width: `calc(${100 / ev.cols}% - 4px)`,
                          }}
                        >
                          <span
                            className={cn(
                              'flex items-center gap-1 text-xs font-medium tabular-nums leading-tight',
                              color.time,
                            )}
                          >
                            {timeFmt.format(ev.startsAt)}
                            {!compact && <>–{timeFmt.format(ev.endsAt)}</>}
                            {isCompleted && (
                              <CheckIcon className="size-3 shrink-0" />
                            )}
                          </span>
                          <span className="truncate font-medium leading-tight text-foreground">
                            {ev.meeting.title}
                          </span>
                          {!compact && (
                            <span className="truncate text-xs leading-tight text-muted-foreground">
                              {locationLabel(ev.meeting)}
                              {ev.meeting.companyName
                                ? ` · ${ev.meeting.companyName}`
                                : ''}
                            </span>
                          )}
                        </button>
                      )
                    })}

                    {/* Current time line */}
                    {isToday && showNowLine && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 z-20"
                        style={{ top: (nowMin / 60) * HOUR_PX }}
                      >
                        <div className="relative border-t-2 border-red-500">
                          <span className="absolute -left-1 -top-[5px] size-2 rounded-full bg-red-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Месячная сетка ──────────────────────────────────────────────── */}
      {mode === 'month' && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <div className="min-w-[880px]">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b">
              {monthDays.slice(0, 7).map((day) => (
                <div
                  key={day.toISOString()}
                  className="border-l px-2 py-2 text-[11px] uppercase tracking-wide text-muted-foreground first:border-l-0"
                >
                  {dayNameFmt.format(day)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                const iso = toISODate(day)
                const inMonth = day.getMonth() === monthStart.getMonth()
                const isToday = todayIso === iso
                const dow = day.getDay()
                const isWeekend = dow === 0 || dow === 6
                const dayEvents = eventsByDate.get(iso) ?? []
                const shown = dayEvents.slice(0, MONTH_CELL_EVENTS)
                const more = dayEvents.length - shown.length
                return (
                  <div
                    key={iso}
                    className={cn(
                      'flex min-h-28 cursor-pointer flex-col gap-1 border-l p-1.5',
                      idx % 7 === 0 && 'border-l-0',
                      idx >= 7 && 'border-t',
                      isWeekend && 'bg-muted/40',
                      !inMonth && 'bg-muted/20',
                      isToday && 'bg-primary/5',
                    )}
                    onClick={() => handleMonthDayClick(day)}
                    title="Создать встречу в этот день"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDay(day)
                      }}
                      title="Открыть день"
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center self-start rounded-full text-sm font-medium tabular-nums hover:bg-accent',
                        !inMonth && 'text-muted-foreground',
                        isToday &&
                          'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      {day.getDate()}
                    </button>

                    {shown.map((m) => {
                      const color = m.meetingRoomId
                        ? (roomColor.get(m.meetingRoomId) ?? NO_ROOM_COLOR)
                        : NO_ROOM_COLOR
                      const startsAt = new Date(m.scheduledAt)
                      const isCompleted = m.status === 'completed'
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void navigate({
                              to: '/meetings/$id/view',
                              params: { id: m.id },
                              search: (prev) => prev,
                            })
                          }}
                          title={`${m.title} · ${locationLabel(m)}\n${timeFmt.format(startsAt)} — ${timeFmt.format(effectiveEnd(m))}`}
                          className={cn(
                            'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-xs leading-tight transition-colors hover:bg-accent',
                            isCompleted && 'opacity-70',
                          )}
                        >
                          <span
                            className={cn(
                              'size-2 shrink-0 rounded-full',
                              color.dot,
                            )}
                          />
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {timeFmt.format(startsAt)}
                          </span>
                          <span className="truncate font-medium">
                            {m.title}
                          </span>
                          {isCompleted && (
                            <CheckIcon className="size-3 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      )
                    })}

                    {more > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDay(day)
                        }}
                        className="self-start rounded px-1 text-xs text-muted-foreground hover:underline"
                      >
                        ещё {more}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {mode === 'month'
          ? 'Клик по дню создаёт встречу, клик по числу открывает день. Цвет точки — переговорка.'
          : 'Клик по свободному месту в сетке создаёт встречу на этот слот. Цвет события — переговорка, серым показаны встречи без брони.'}
      </p>
    </div>
  )
}
