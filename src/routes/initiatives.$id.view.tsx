import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Building2Icon,
  ChevronDownIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { fetchInitiative } from '@/components/initiatives/actions'
import { fetchProposalsByInitiative } from '@/components/proposals/actions'
import { fetchMeetingsByInitiative } from '@/components/meetings/actions'
import { InitiativeQuickActions } from '@/components/initiatives/initiative-quick-actions'
import { InitiativeProposalsSection } from '@/components/proposals/proposal-section'
import { InitiativeMeetingsSection } from '@/components/meetings/initiative-meetings-section'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/initiatives/$id/view')({
  loader: async ({ params }) => {
    const [item, proposals, meetings] = await Promise.all([
      fetchInitiative({ data: { id: params.id } }),
      fetchProposalsByInitiative({ data: { initiativeId: params.id } }),
      fetchMeetingsByInitiative({ data: { initiativeId: params.id } }),
    ])
    return { item, proposals, meetings }
  },
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

const dueDateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const moneyFmt = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

const MS_PER_DAY = 86_400_000

const SOURCE_LABELS: Record<string, string> = {
  lead: 'Лид',
  signal: 'Сигнал',
  tender: 'Тендер',
  account: 'Аккаунт',
  manual: 'Вручную',
}

type InitiativeStatus = 'open' | 'won' | 'lost' | 'closed'

const STATUS_META: Record<
  InitiativeStatus,
  {
    label: string
    variant: 'secondary' | 'success' | 'destructive' | 'outline'
  }
> = {
  open: { label: 'В работе', variant: 'secondary' },
  won: { label: 'Выиграна', variant: 'success' },
  lost: { label: 'Проиграна', variant: 'destructive' },
  closed: { label: 'Закрыта', variant: 'outline' },
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

/** Сворачиваемая секция со счётчиком — свёрнута по умолчанию. */
function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <Collapsible className="px-4 py-4">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        <span className="flex items-baseline gap-1.5">
          {title}
          <span className="font-normal tabular-nums">· {count}</span>
        </span>
        <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
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
  destructive,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  destructive?: boolean
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-base font-semibold tabular-nums',
          destructive && 'text-destructive',
        )}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            'truncate text-sm text-muted-foreground',
            destructive && 'text-destructive/80',
          )}
        >
          {sub}
        </p>
      )}
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
  const { item, proposals, meetings } = Route.useLoaderData()
  const navigate = useNavigate()
  const panelRef = React.useRef<HTMLElement>(null)

  // Keep ?pipeline=... when leaving so the board stays on the same tab.
  const close = React.useCallback(() => {
    void navigate({ to: '/initiatives', search: (prev) => prev })
  }, [navigate])

  // The panel is a non-modal "peek" (no overlay, the kanban behind stays
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

  const status: InitiativeStatus = item.stage?.isWon
    ? 'won'
    : item.stage?.isLost
      ? 'lost'
      : item.closedAt
        ? 'closed'
        : 'open'
  const statusMeta = STATUS_META[status]
  const isClosed = status !== 'open'

  // Stage path across the pipeline
  const stages = item.pipeline?.stages ?? []
  const currentStageIdx = stages.findIndex((s) => s.id === item.stage?.id)

  // Key dates
  const createdAt = new Date(item.createdAt)
  const closedAt = item.closedAt ? new Date(item.closedAt) : null
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const dueDate = item.dueDate ? new Date(`${item.dueDate}T00:00:00`) : null
  const daysLeft = dueDate
    ? Math.round((dueDate.getTime() - startOfToday.getTime()) / MS_PER_DAY)
    : null
  const isOverdue = status === 'open' && daysLeft !== null && daysLeft < 0
  const daysInPipeline = Math.max(
    0,
    Math.floor(
      ((closedAt ?? new Date()).getTime() - createdAt.getTime()) / MS_PER_DAY,
    ),
  )

  const dueSub =
    status !== 'open' || daysLeft === null
      ? undefined
      : daysLeft < 0
        ? `просрочено ${Math.abs(daysLeft)} ${pluralDays(Math.abs(daysLeft))}`
        : daysLeft === 0
          ? 'сегодня'
          : `осталось ${daysLeft} ${pluralDays(daysLeft)}`

  const sourceLink = item.sourceLead
    ? {
        to: '/leads/$id/view' as const,
        id: item.sourceLead.id,
        title: item.sourceLead.title,
      }
    : item.sourceSignal
      ? {
          to: '/signals/$id/view' as const,
          id: item.sourceSignal.id,
          title: item.sourceSignal.title,
        }
      : item.sourceTender
        ? {
            to: '/tenders/$id/view' as const,
            id: item.sourceTender.id,
            title: item.sourceTender.title,
          }
        : null

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-label={item.title}
      tabIndex={-1}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l bg-background shadow-xl outline-none animate-in slide-in-from-right duration-300"
    >
      {/* ── Header: status, title, key relations ─────────────────────────── */}
      <header className="space-y-2.5 border-b px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            {closedAt && (
              <span className="text-sm text-muted-foreground">
                {dateFmt.format(closedAt)}
              </span>
            )}
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
                to="/initiatives/$id/update"
                params={{ id: item.id }}
                search={(prev) => prev}
                aria-label="Редактировать инициативу"
              >
                <PencilIcon className="size-4" />
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
                to="/initiatives/$id/delete"
                params={{ id: item.id }}
                search={(prev) => prev}
                aria-label="Удалить инициативу"
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
          title={item.title}
        >
          {item.title}
        </h2>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground">
          {item.company && (
            <Link
              to="/companies/$id/view"
              params={{ id: item.company.id }}
              className="flex min-w-0 items-center gap-1 text-foreground hover:underline"
            >
              <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{item.company.name}</span>
            </Link>
          )}
          {item.department && (
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: item.department.accentColor ?? '#6b7280',
                }}
              />
              {item.department.name}
            </span>
          )}
          {item.responsible && (
            <span className="flex items-center gap-1">
              <UserRoundIcon className="size-4" />
              {item.responsible.name}
            </span>
          )}
        </div>
      </header>

      {/* ── Stage path through the pipeline ──────────────────────────────── */}
      {stages.length > 0 && (
        <section
          className="border-b bg-muted/30 px-4 py-3"
          aria-label={
            currentStageIdx >= 0
              ? `Этап ${currentStageIdx + 1} из ${stages.length}: ${item.stage?.name}`
              : 'Этап воронки'
          }
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium text-muted-foreground">
              {item.pipeline?.name}
            </span>
            {currentStageIdx >= 0 && (
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                этап {currentStageIdx + 1} из {stages.length}
              </span>
            )}
          </div>

          <div className="mt-2 flex gap-1" aria-hidden="true">
            {stages.map((s, idx) => {
              const reached = currentStageIdx >= 0 && idx <= currentStageIdx
              return (
                <div
                  key={s.id}
                  title={s.name}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    !reached && 'bg-border',
                  )}
                  style={
                    reached
                      ? { backgroundColor: item.stage?.color ?? undefined }
                      : undefined
                  }
                />
              )
            })}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-base font-medium">
            {item.stage ? (
              <>
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.stage.color }}
                />
                {item.stage.name}
              </>
            ) : (
              <span className="text-muted-foreground">Этап не задан</span>
            )}
          </div>
        </section>
      )}

      {/* ── Key figures ──────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-3 divide-x border-b"
        aria-label="Ключевые показатели"
      >
        <Stat
          label="Бюджет"
          value={item.budget ? moneyFmt.format(Number(item.budget)) : dash}
        />
        <Stat
          label="Срок сделки"
          value={dueDate ? dueDateFmt.format(dueDate) : dash}
          sub={dueSub}
          destructive={isOverdue}
        />
        <Stat
          label={isClosed ? 'Цикл сделки' : 'В работе'}
          value={`${daysInPipeline} ${pluralDays(daysInPipeline)}`}
          sub={
            closedAt
              ? `${shortDateFmt.format(createdAt)} — ${shortDateFmt.format(closedAt)}`
              : `с ${shortDateFmt.format(createdAt)}`
          }
        />
      </section>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 divide-y overflow-y-auto overscroll-contain">
        {status === 'lost' && item.refusalReason && (
          <section className="px-4 py-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                Причина отказа
              </p>
              <p className="mt-1 text-base">{item.refusalReason.name}</p>
            </div>
          </section>
        )}

        <section className="px-4 py-3">
          <InitiativeQuickActions
            initiativeId={item.id}
            companyId={item.company?.id ?? null}
            departmentId={item.department?.id ?? null}
          />
        </section>

        {item.description && (
          <section className="space-y-2 px-4 py-4">
            <SectionTitle>Описание</SectionTitle>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {item.description}
            </p>
          </section>
        )}

        <section className="space-y-3 px-4 py-4">
          <SectionTitle>Сведения</SectionTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Источник">
              <span>{SOURCE_LABELS[item.sourceType] ?? item.sourceType}</span>
              {sourceLink && (
                <Link
                  to={sourceLink.to}
                  params={{ id: sourceLink.id }}
                  className="ml-1.5 text-primary hover:underline"
                  title={sourceLink.title}
                >
                  {sourceLink.title}
                  <ExternalLinkIcon className="ml-1 inline size-3" />
                </Link>
              )}
            </Field>
            <Field label="Подразделение">{item.department?.name ?? dash}</Field>
            <Field label="Создана">{dateFmt.format(createdAt)}</Field>
            <Field label="Обновлена">
              {dateFmt.format(new Date(item.updatedAt))}
            </Field>
          </div>
        </section>

        <CollapsibleSection title="Встречи" count={meetings.length}>
          {meetings.length > 0 ? (
            <InitiativeMeetingsSection meetings={meetings} />
          ) : (
            <EmptyHint>Встреч пока нет.</EmptyHint>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Коммерческие предложения"
          count={proposals.length}
        >
          {proposals.length > 0 ? (
            <InitiativeProposalsSection proposals={proposals} />
          ) : (
            <EmptyHint>КП ещё не создавались.</EmptyHint>
          )}
        </CollapsibleSection>
      </div>
    </aside>
  )
}
