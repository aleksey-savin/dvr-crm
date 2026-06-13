import * as React from 'react'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import {
  Building2Icon,
  CalendarSyncIcon,
  CheckIcon,
  CopyIcon,
  DoorOpenIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchMeeting } from '@/components/meetings/actions'
import { CancelMeetingDialog } from '@/components/meetings/cancel-meeting-dialog'
import { CompleteMeetingDialog } from '@/components/meetings/complete-meeting-dialog'
import { RescheduleMeetingDialog } from '@/components/meetings/reschedule-meeting-dialog'
import { RescheduledBadge } from '@/components/meetings/rescheduled-badge'
import { getMonday, toISODate } from '@/components/meetings/meetings-calendar'
import { cn } from '@/lib/utils'
import type { MeetingLocationType, MeetingStatus, MeetingType } from '@/types'

export const Route = createFileRoute('/meetings/$id/view')({
  loader: ({ params }) => fetchMeeting({ data: params }),
  component: RouteComponent,
})

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
})

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const MS_PER_DAY = 86_400_000

function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

function relativeDayLabel(target: Date): string {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTarget = new Date(target)
  startOfTarget.setHours(0, 0, 0, 0)
  const diff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / MS_PER_DAY,
  )
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'завтра'
  if (diff === -1) return 'вчера'
  if (diff > 1) return `через ${diff} ${pluralDays(diff)}`
  return `${Math.abs(diff)} ${pluralDays(Math.abs(diff))} назад`
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

const STATUS_META: Record<
  MeetingStatus,
  {
    label: string
    variant: 'default' | 'success' | 'destructive' | 'warning'
  }
> = {
  scheduled: { label: 'Запланирована', variant: 'default' },
  completed: { label: 'Проведена', variant: 'success' },
  cancelled: { label: 'Отменена', variant: 'destructive' },
  rescheduled: { label: 'Перенесена', variant: 'warning' },
}

const TYPE_LABELS: Record<MeetingType, string> = {
  client: 'Клиентская',
  internal: 'Внутренняя',
}

const LOCATION_LABELS: Record<MeetingLocationType, string> = {
  client_site: 'У клиента',
  office: 'В офисе',
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function SectionTitle({
  children,
  count,
}: {
  children: React.ReactNode
  count?: number
}) {
  return (
    <h3 className="flex items-baseline gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
      {typeof count === 'number' && count > 0 && (
        <span className="font-normal tabular-nums">· {count}</span>
      )}
    </h3>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base">{children}</span>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-base font-semibold tabular-nums"
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </p>
      {sub && <p className="truncate text-sm text-muted-foreground">{sub}</p>}
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-muted-foreground">{children}</p>
}

const dash = <span className="text-muted-foreground">—</span>

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const meeting = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const panelRef = React.useRef<HTMLElement>(null)
  const [completeOpen, setCompleteOpen] = React.useState(false)
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)

  const close = React.useCallback(() => {
    // Сохраняем представление (вид/неделю), поверх которого открыта панель.
    void navigate({ to: '/meetings', search: (prev) => prev })
  }, [navigate])

  // The panel is a non-modal "peek" (no overlay, the table behind stays
  // clickable), so Escape is wired manually. Radix layers (nested dialogs,
  // popovers) call preventDefault on the Escape they consume — skip those.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close])

  React.useEffect(() => {
    panelRef.current?.focus({ preventScroll: true })
  }, [])

  const statusMeta = STATUS_META[meeting.status]
  const scheduledAt = new Date(meeting.scheduledAt)
  const endedAt = meeting.endedAt ? new Date(meeting.endedAt) : null
  const durationMs =
    endedAt && endedAt.getTime() > scheduledAt.getTime()
      ? endedAt.getTime() - scheduledAt.getTime()
      : null
  const isOffice = meeting.locationType === 'office'
  const weekOfMeeting = toISODate(getMonday(scheduledAt))

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-label={meeting.title}
      tabIndex={-1}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l bg-background shadow-xl outline-none animate-in slide-in-from-right duration-300"
    >
      {/* ── Header: status, title, key relations ─────────────────────────── */}
      <header className="space-y-2.5 border-b px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            <Badge variant="outline">{TYPE_LABELS[meeting.meetingType]}</Badge>
            <RescheduledBadge count={meeting.rescheduleCount} />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8"
              title="Редактировать"
            >
              <Link
                to="/meetings/$id/update"
                params={{ id: meeting.id }}
                search={(prev) => prev}
                aria-label="Редактировать встречу"
              >
                <PencilIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8"
              title="Копировать"
            >
              <Link
                to="/meetings/$id/copy"
                params={{ id: meeting.id }}
                search={(prev) => prev}
                aria-label="Копировать встречу"
              >
                <CopyIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              title="Удалить"
            >
              <Link
                to="/meetings/$id/delete"
                params={{ id: meeting.id }}
                search={(prev) => prev}
                aria-label="Удалить встречу"
              >
                <Trash2Icon className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={close}
              title="Закрыть"
              aria-label="Закрыть панель"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        <h2
          className="line-clamp-2 text-xl font-semibold leading-snug"
          title={meeting.title}
        >
          {meeting.title}
        </h2>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground">
          {meeting.companyId && meeting.companyName && (
            <Link
              to="/companies/$id/view"
              params={{ id: meeting.companyId }}
              className="flex min-w-0 items-center gap-1 text-foreground hover:underline"
            >
              <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{meeting.companyName}</span>
            </Link>
          )}
          {meeting.departmentName && <span>{meeting.departmentName}</span>}
          {meeting.organizerName && (
            <span className="flex items-center gap-1">
              <UserRoundIcon className="size-4" />
              {meeting.organizerName}
            </span>
          )}
        </div>
      </header>

      {/* ── Key figures ──────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-3 divide-x border-b"
        aria-label="Ключевые параметры"
      >
        <Stat
          label="Начало"
          value={shortDateFmt.format(scheduledAt)}
          sub={`${timeFmt.format(scheduledAt)} · ${relativeDayLabel(scheduledAt)}`}
        />
        <Stat
          label="Длительность"
          value={durationMs ? formatDuration(durationMs) : dash}
          sub={endedAt ? `до ${timeFmt.format(endedAt)}` : undefined}
        />
        <Stat
          label="Место"
          value={LOCATION_LABELS[meeting.locationType]}
          sub={
            isOffice
              ? (meeting.meetingRoomName ?? 'без переговорки')
              : (meeting.companyName ?? undefined)
          }
        />
      </section>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 divide-y overflow-y-auto overscroll-contain">
        {meeting.status === 'scheduled' && (
          <section className="flex flex-wrap gap-2 px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompleteOpen(true)}
            >
              <CheckIcon className="size-4" />
              Проведена
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRescheduleOpen(true)}
            >
              <CalendarSyncIcon className="size-4" />
              Перенести
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              <XIcon className="size-4" />
              Отменить
            </Button>
          </section>
        )}

        {isOffice && meeting.meetingRoomId && meeting.meetingRoomName && (
          <section className="px-4 py-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <DoorOpenIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">
                    {meeting.meetingRoomName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {meeting.status === 'scheduled'
                      ? 'Слот забронирован этой встречей'
                      : 'Бронь неактивна'}
                  </p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link
                  to="/meetings"
                  search={{ view: 'calendar', week: weekOfMeeting }}
                >
                  Календарь
                  <ExternalLinkIcon className="size-3.5" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        <section className="space-y-3 px-4 py-4">
          <SectionTitle count={meeting.participantCount}>
            Участники
          </SectionTitle>
          {meeting.participants.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm text-muted-foreground">Наши</p>
              <div className="flex flex-wrap gap-1.5">
                {meeting.participants.map((p) => (
                  <Badge key={p.userId} variant="secondary">
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {meeting.externalParticipants.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm text-muted-foreground">
                Клиентская сторона
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meeting.externalParticipants.map((ep) => (
                  <Badge key={ep.id} variant="outline">
                    {ep.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {meeting.participants.length === 0 &&
            meeting.externalParticipants.length === 0 && (
              <EmptyHint>Участники не указаны.</EmptyHint>
            )}
        </section>

        {meeting.summary && (
          <section className="space-y-2 px-4 py-4">
            <SectionTitle>Саммари</SectionTitle>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {meeting.summary}
            </p>
          </section>
        )}

        {meeting.status === 'cancelled' && meeting.cancelReason && (
          <section className="space-y-2 px-4 py-4">
            <SectionTitle>Причина отмены</SectionTitle>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {meeting.cancelReason}
            </p>
          </section>
        )}

        <section className="space-y-3 px-4 py-4">
          <SectionTitle>Сведения</SectionTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Инициатива">
              {meeting.initiativeId && meeting.initiativeTitle ? (
                <Link
                  to="/initiatives/$id/view"
                  params={{ id: meeting.initiativeId }}
                  className={cn('text-primary hover:underline')}
                  title={meeting.initiativeTitle}
                >
                  {meeting.initiativeTitle}
                  <ExternalLinkIcon className="ml-1 inline size-3" />
                </Link>
              ) : (
                dash
              )}
            </Field>
            <Field label="Подразделение">
              {meeting.departmentName ?? dash}
            </Field>
            <Field label="Создана">
              {dateFmt.format(new Date(meeting.createdAt))}
            </Field>
            {meeting.rescheduledFromMeetingId && (
              <Field label="Перенесена с">
                <Link
                  to="/meetings/$id/view"
                  params={{ id: meeting.rescheduledFromMeetingId }}
                  className="text-primary hover:underline"
                >
                  исходная встреча
                  <ExternalLinkIcon className="ml-1 inline size-3" />
                </Link>
              </Field>
            )}
          </div>
        </section>
      </div>

      <CompleteMeetingDialog
        meetingId={meeting.id}
        initialSummary={meeting.summary}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onCompleted={() => router.invalidate()}
      />
      <RescheduleMeetingDialog
        meetingId={meeting.id}
        currentScheduledAt={meeting.scheduledAt}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onRescheduled={() => router.invalidate()}
      />
      <CancelMeetingDialog
        meetingId={meeting.id}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCancelled={() => router.invalidate()}
      />
    </aside>
  )
}
