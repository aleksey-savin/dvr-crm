import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, Building2Icon } from 'lucide-react'
import { CompletionBar } from '@/components/target-actions/completion-bar'
import {
  completionPercent,
  numberFmt,
  percentLabel,
} from '@/components/target-actions/report-utils'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import type { TargetActionManagerSummary } from '@/types'

type DeptSummary = {
  departmentId: string
  departmentName: string
  managerCount: number
  percent: number
}

/**
 * "Сводка ЦД по подразделениям" dashboard widget (heads/admins only):
 * plan-completion progress per revenue-center department plus the top-5
 * managers ranked by plan-completion %. The team is already scoped to the
 * selected department by the parent container.
 */
export function DepartmentSummaryCard({
  team,
  month,
  year,
}: {
  team: TargetActionManagerSummary[]
  month: number
  year: number
}) {
  const period = new Date(year, month - 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  // Aggregate managers into their (leaf) revenue-center department. The
  // department completion is the average of each manager's own completion %;
  // managers without any plan (percent === null) are excluded from the average.
  const byDept = new Map<
    string,
    { departmentName: string; percentSum: number; managerCount: number }
  >()
  for (const m of team) {
    const percent = completionPercent(m.totalFact, m.totalPlanned)
    if (percent === null) continue
    const id = m.departmentId ?? '—'
    const group = byDept.get(id) ?? {
      departmentName: m.departmentName ?? 'Без подразделения',
      percentSum: 0,
      managerCount: 0,
    }
    group.percentSum += percent
    group.managerCount += 1
    byDept.set(id, group)
  }
  const departments: DeptSummary[] = Array.from(byDept.entries())
    .map(([departmentId, g]) => ({
      departmentId,
      departmentName: g.departmentName,
      managerCount: g.managerCount,
      percent: Math.round(g.percentSum / g.managerCount),
    }))
    .sort(
      (a, b) =>
        b.percent - a.percent ||
        b.managerCount - a.managerCount ||
        a.departmentName.localeCompare(b.departmentName, 'ru'),
    )

  // Top-5 managers by plan-completion % (a plan is required to rank).
  const top = team
    .filter((m) => m.totalPlanned > 0)
    .map((m) => ({
      ...m,
      percent: completionPercent(m.totalFact, m.totalPlanned) ?? 0,
    }))
    .sort((a, b) => b.percent - a.percent || b.totalFact - a.totalFact)
    .slice(0, 5)

  return (
    <Card className="rounded-lg w-full">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2Icon className="size-4" />
          Сводка ЦД по подразделениям · {period}
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link
              to="/reports/target-actions"
              search={{ period: 'month', year, pi: month }}
            >
              Подробнее
              <ArrowRightIcon />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {departments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Планы по целевым действиям в команде ещё не выставлены.
          </p>
        ) : (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              По подразделениям
            </h3>
            <ul className="flex flex-col gap-3">
              {departments.map((d) => (
                <li key={d.departmentId} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{d.departmentName}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {d.managerCount} чел. · {percentLabel(d.percent)}
                    </span>
                  </div>
                  <CompletionBar percent={d.percent} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {top.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Топ-5 менеджеров
            </h3>
            <ol className="flex flex-col gap-3">
              {top.map((m, index) => (
                <li key={m.userId} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{m.userName}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {percentLabel(m.percent)} ·{' '}
                        {numberFmt.format(m.totalFact)}/
                        {numberFmt.format(m.totalPlanned)}
                      </span>
                    </div>
                    <CompletionBar percent={m.percent} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </CardContent>
    </Card>
  )
}
