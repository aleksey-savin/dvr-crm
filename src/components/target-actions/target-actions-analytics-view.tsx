import { TargetIcon, TrendingUpIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { useDepartmentStore } from '@/stores/department-store'
import { TargetActionsPeriodPicker } from './target-actions-period-picker'
import { TargetActionsChart } from './target-actions-chart'
import { TargetActionsMatrix } from './target-actions-matrix'
import { ManagerReportSheet } from './manager-report-sheet'
import { recomputeTotals } from './report-utils'
import type {
  ManagerReportDetail,
  TargetActionAnalytics,
  TargetActionPeriod,
} from '@/types'

export function TargetActionsAnalyticsView({
  analytics,
  detail,
  onPeriodChange,
  onSelectManager,
  onCloseManager,
}: {
  analytics: TargetActionAnalytics
  detail: ManagerReportDetail | null
  onPeriodChange: (period: TargetActionPeriod) => void
  onSelectManager: (userId: string) => void
  onCloseManager: () => void
}) {
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const rows = selectedDepartmentId
    ? analytics.rows.filter((r) => r.departmentId === selectedDepartmentId)
    : analytics.rows
  const totals = selectedDepartmentId
    ? recomputeTotals(rows, analytics.types)
    : analytics.totals
  const filtered: TargetActionAnalytics = { ...analytics, rows, totals }

  return (
    <div className="flex w-full flex-col gap-6">
      <TargetActionsPeriodPicker
        period={analytics.period}
        label={analytics.label}
        onChange={onPeriodChange}
      />

      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TargetIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>
            Нет данных по целевым действиям за выбранный период
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center gap-2 text-base font-medium">
                <TrendingUpIcon className="size-4" />
                Факт по типам целевых действий
              </div>
            </CardHeader>
            <CardContent>
              <TargetActionsChart rows={rows} types={analytics.types} />
            </CardContent>
          </Card>

          <TargetActionsMatrix
            analytics={filtered}
            onSelectManager={onSelectManager}
          />
        </>
      )}

      <ManagerReportSheet
        detail={detail}
        periodLabel={analytics.label}
        teamTotals={filtered.totals}
        teamSize={filtered.rows.length}
        onClose={onCloseManager}
      />
    </div>
  )
}
