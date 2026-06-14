import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  MailIcon,
  PhoneIcon,
  TargetIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { getInitials } from '@/components/departments/text-utils'
import { completionVariant, numberFmt, percentLabel } from './report-utils'
import type {
  ManagerCompletedAction,
  ManagerReportDetail,
  TargetActionAnalytics,
} from '@/types'

function formatDate(at: Date | string) {
  return new Date(at).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(at: Date | string) {
  return new Date(at).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDurationMin(min: number | null) {
  if (min === null || min <= 0) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0) return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
  return `${m} мин`
}

function Dash() {
  return <span className="text-muted-foreground">—</span>
}

// One drill-down group: a target-action type with its plan/fact/% and the
// concrete completed actions that produced the fact. `plannable: false` marks
// fact-only types (e.g. meeting_rescheduled) that carry no plan.
type TypeSection = {
  typeId: string
  name: string
  planned: number
  fact: number
  percent: number | null
  teamPercent: number | null
  actions: ManagerCompletedAction[]
  plannable: boolean
}

export function ManagerReportSheet({
  detail,
  periodLabel,
  teamTotals,
  teamSize,
  onClose,
}: {
  detail: ManagerReportDetail | null
  periodLabel: string
  teamTotals: TargetActionAnalytics['totals']
  teamSize: number
  onClose: () => void
}) {
  return (
    <Sheet
      open={!!detail}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-[calc(100vw-16rem)]">
        {detail ? (
          <ManagerReportContent
            detail={detail}
            periodLabel={periodLabel}
            teamTotals={teamTotals}
            teamSize={teamSize}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ManagerReportContent({
  detail,
  periodLabel,
  teamTotals,
  teamSize,
}: {
  detail: ManagerReportDetail
  periodLabel: string
  teamTotals: TargetActionAnalytics['totals']
  teamSize: number
}) {
  const { summary } = detail
  const showTeam = teamSize > 1

  // Group completed actions by type — counts here match the matrix «Факт»
  // because both pull completed actions of the same period/responsible user.
  const actionsByType = new Map<string, ManagerCompletedAction[]>()
  for (const action of detail.completedActions) {
    const list = actionsByType.get(action.typeId) ?? []
    list.push(action)
    actionsByType.set(action.typeId, list)
  }

  const knownTypeIds = new Set(detail.types.map((t) => t.id))

  // Every report type (plannable + fact-only) with any plan or fact. Fact-only
  // types carry a count only — no plan, no percent.
  const typeSections: TypeSection[] = detail.types
    .map((type) => {
      const cell = summary.cells[type.id]
      return {
        typeId: type.id,
        name: type.name,
        planned: cell.planned,
        fact: cell.fact,
        percent: cell.percent,
        teamPercent: teamTotals.byType[type.id].percent,
        actions: actionsByType.get(type.id) ?? [],
        plannable: type.isPlannable,
      }
    })
    .filter((s) => s.planned > 0 || s.fact > 0)

  // Actions whose type is no longer in the report (e.g. deleted) — keep visible.
  const orphanSections: TypeSection[] = [...actionsByType.entries()]
    .filter(([typeId]) => !knownTypeIds.has(typeId))
    .map(([typeId, actions]) => ({
      typeId,
      name: actions[0].typeName,
      planned: 0,
      fact: actions.length,
      percent: null,
      teamPercent: null,
      actions,
      plannable: false,
    }))

  const sections = [...typeSections, ...orphanSections]

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            {detail.user.image ? (
              <AvatarImage src={detail.user.image} alt={detail.user.name} />
            ) : null}
            <AvatarFallback>{getInitials(detail.user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <SheetTitle>{detail.user.name}</SheetTitle>
            <SheetDescription>
              {[detail.user.position, detail.user.departmentName]
                .filter(Boolean)
                .join(' · ') || 'Сотрудник'}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-4 pb-6">
        <section className="flex flex-wrap gap-x-8 gap-y-2 pt-2 text-sm">
          {detail.user.phone ? (
            <span className="flex items-center gap-2">
              <PhoneIcon className="size-4 text-muted-foreground" />
              {detail.user.phone}
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <MailIcon className="size-4 text-muted-foreground" />
            {detail.user.email}
          </span>
        </section>

        {/* Key figures — plan / fact / completion (+ team comparison) */}
        <section
          className={`grid divide-x overflow-hidden rounded-md border ${
            showTeam ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
          }`}
          aria-label={`План и факт · ${periodLabel}`}
        >
          <Stat label="План" value={numberFmt.format(summary.totalPlanned)} />
          <Stat label="Факт" value={numberFmt.format(summary.totalFact)} />
          <Stat
            label="Выполнение"
            value={
              <Badge variant={completionVariant(summary.overallPercent)}>
                {percentLabel(summary.overallPercent)}
              </Badge>
            }
          />
          {showTeam ? (
            <Stat
              label={`Команда · ${teamSize}`}
              value={
                <span className="flex items-center gap-2">
                  {percentLabel(teamTotals.overallPercent)}
                  <DeltaBadge
                    managerPercent={summary.overallPercent}
                    teamPercent={teamTotals.overallPercent}
                  />
                </span>
              }
            />
          ) : null}
        </section>

        {/* Per-type drill-down */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-base font-medium">
            <TrendingUpIcon className="size-4" />
            Детали
          </div>
          {sections.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TargetIcon />
                </EmptyMedia>
              </EmptyHeader>
              <EmptyDescription>Нет данных за период</EmptyDescription>
            </Empty>
          ) : (
            <div className="divide-y overflow-hidden rounded-md border">
              {sections.map((section) => (
                <TypeSectionRow
                  key={section.typeId}
                  section={section}
                  showTeam={showTeam}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
    </div>
  )
}

// Manager's completion % vs the team's, as a signed percentage-point delta.
function DeltaBadge({
  managerPercent,
  teamPercent,
}: {
  managerPercent: number | null
  teamPercent: number | null
}) {
  if (managerPercent === null || teamPercent === null) return null
  const delta = managerPercent - teamPercent
  const up = delta >= 0
  return (
    <Badge variant={up ? 'success' : 'warning'} className="gap-0.5">
      {up ? (
        <ArrowUpIcon className="size-3" />
      ) : (
        <ArrowDownIcon className="size-3" />
      )}
      {up ? '+' : ''}
      {delta} п.п.
    </Badge>
  )
}

function TypeSectionRow({
  section,
  showTeam,
}: {
  section: TypeSection
  showTeam: boolean
}) {
  // Meeting-sourced sections render as a table (name links to the meeting).
  const isMeetingSection =
    section.actions.length > 0 &&
    section.actions.every((action) => action.sourceType === 'meeting')

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50">
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="flex-1 text-sm font-medium">{section.name}</span>
        {section.plannable ? (
          <>
            <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
              План {numberFmt.format(section.planned)} · Факт{' '}
              {numberFmt.format(section.fact)}
            </span>
            <Badge variant={completionVariant(section.percent)}>
              {percentLabel(section.percent)}
            </Badge>
            {showTeam && section.teamPercent !== null ? (
              <span className="hidden w-24 text-right text-xs text-muted-foreground lg:inline">
                команда {section.teamPercent}%
              </span>
            ) : null}
          </>
        ) : (
          <Badge variant="secondary">
            Факт {numberFmt.format(section.fact)}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {section.actions.length === 0 ? (
          <p className="border-t px-3 py-2.5 text-sm italic text-muted-foreground">
            Нет выполненных действий
          </p>
        ) : isMeetingSection ? (
          <MeetingActionsTable actions={section.actions} />
        ) : (
          <div className="divide-y border-t bg-muted/20">
            {section.actions.map((action) => (
              <CompletedActionRow key={action.id} action={action} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function MeetingActionsTable({
  actions,
}: {
  actions: ManagerCompletedAction[]
}) {
  return (
    <div className="overflow-x-auto border-t bg-muted/20">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Наименование</TableHead>
            <TableHead>Инициатива</TableHead>
            <TableHead>Компания</TableHead>
            <TableHead className="whitespace-nowrap">Дата</TableHead>
            <TableHead className="whitespace-nowrap">Длительность</TableHead>
            <TableHead>Участники</TableHead>
            <TableHead>Саммари</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((action) => {
            const duration = formatDurationMin(action.meetingDurationMin)
            return (
              <TableRow key={action.id} className="align-top">
                <TableCell className="font-medium">
                  {action.meetingId && action.meetingTitle ? (
                    <Link
                      to="/meetings/$id/view"
                      params={{ id: action.meetingId }}
                      className="hover:underline"
                    >
                      {action.meetingTitle}
                    </Link>
                  ) : (
                    (action.meetingTitle ?? <Dash />)
                  )}
                </TableCell>
                <TableCell>{action.initiativeTitle ?? <Dash />}</TableCell>
                <TableCell>
                  {action.companyId && action.companyName ? (
                    <Link
                      to="/companies/$id/view"
                      params={{ id: action.companyId }}
                      className="hover:underline"
                    >
                      {action.companyName}
                    </Link>
                  ) : (
                    <Dash />
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {action.meetingAt
                    ? formatDateTime(action.meetingAt)
                    : formatDate(action.completedAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {duration ?? <Dash />}
                </TableCell>
                <TableCell>
                  {action.meetingParticipants.length > 0 ? (
                    <span className="block max-w-48 truncate">
                      {action.meetingParticipants.join(', ')}
                    </span>
                  ) : (
                    <Dash />
                  )}
                </TableCell>
                <TableCell>
                  {action.meetingSummary ? (
                    <span className="line-clamp-2 max-w-72 text-muted-foreground">
                      {action.meetingSummary}
                    </span>
                  ) : (
                    <Dash />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function CompletedActionRow({ action }: { action: ManagerCompletedAction }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5 pl-10">
      <span className="text-sm text-muted-foreground">
        {formatDate(action.completedAt)}
      </span>
      {action.meetingTitle ? (
        <div className="text-sm">
          <span className="text-muted-foreground">Встреча: </span>
          {action.meetingTitle}
          {action.meetingAt ? (
            <span className="text-muted-foreground">
              {' · '}
              {formatDateTime(action.meetingAt)}
            </span>
          ) : null}
        </div>
      ) : null}
      {action.details.map((item) => (
        <div key={item.label} className="text-sm">
          <span className="text-muted-foreground">{item.label}: </span>
          {item.companyId ? (
            <Link
              to="/companies/$id/view"
              params={{ id: item.companyId }}
              className="hover:underline"
            >
              {item.value}
            </Link>
          ) : (
            item.value
          )}
        </div>
      ))}
      {action.result ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Результат: </span>
          {action.result}
        </p>
      ) : null}
      {action.reason ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Причина: </span>
          {action.reason}
        </p>
      ) : null}
    </div>
  )
}
