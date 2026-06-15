import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, ChevronDownIcon, TargetIcon } from 'lucide-react'
import { CompletionBar } from '@/components/target-actions/completion-bar'
import {
  completionPercent,
  numberFmt,
  percentLabel,
} from '@/components/target-actions/report-utils'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { TargetActionPlanRow } from '@/types'

/**
 * "My target actions" dashboard widget: a prominent total plan-completion bar
 * plus a collapsible per-type breakdown (each type with its own progress bar).
 */
export function MyTargetActionsCard({
  mine,
  month,
  year,
}: {
  mine: TargetActionPlanRow[]
  month: number
  year: number
}) {
  const period = new Date(year, month - 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })
  const rows = mine.filter((r) => r.plannedCount > 0 || r.factCount > 0)
  const totalPlanned = rows.reduce((sum, r) => sum + r.plannedCount, 0)
  const totalFact = rows.reduce((sum, r) => sum + r.factCount, 0)
  const overallPercent = completionPercent(totalFact, totalPlanned)

  return (
    <Card className="rounded-lg w-full">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TargetIcon className="size-4" />
          Мои целевые действия · {period}
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
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            План целевых действий на этот месяц не выставлен.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-end justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Выполнено {numberFmt.format(totalFact)} из{' '}
                  {numberFmt.format(totalPlanned)}
                </span>
                <span className="text-2xl font-semibold leading-none tabular-nums">
                  {percentLabel(overallPercent)}
                </span>
              </div>
              <CompletionBar percent={overallPercent} size="lg" />
            </div>

            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Подробнее по типам
                <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <ul className="flex flex-col gap-3">
                  {rows.map((row) => {
                    const percent = completionPercent(
                      row.factCount,
                      row.plannedCount,
                    )
                    return (
                      <li key={row.typeId} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{row.typeName}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {numberFmt.format(row.factCount)}/
                            {numberFmt.format(row.plannedCount)} ·{' '}
                            {percentLabel(percent)}
                          </span>
                        </div>
                        <CompletionBar percent={percent} />
                      </li>
                    )
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
