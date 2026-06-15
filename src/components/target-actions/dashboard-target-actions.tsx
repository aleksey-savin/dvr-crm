import { DepartmentSummaryCard } from '@/components/target-actions/department-summary-card'
import { MyTargetActionsCard } from '@/components/target-actions/my-target-actions-card'
import {
  matchesDepartmentScope,
  useScopedDepartmentIds,
} from '@/hooks/use-department-scope'
import { cn } from '@/lib/utils'
import type { TargetActionDashboard } from '@/types'

/**
 * Target-action dashboard widgets. Regular users see a single full-width
 * "my target actions" card; heads/admins additionally get the revenue-center
 * summary, and the two cards split into a 2-column grid.
 */
export function DashboardTargetActions({
  data,
}: {
  data: TargetActionDashboard
}) {
  // Scope the team summary to the globally selected department (+ descendants).
  const scopedIds = useScopedDepartmentIds()
  const team = (data.team ?? []).filter((m) =>
    matchesDepartmentScope(scopedIds, m.departmentId),
  )
  const showTeam = data.isHead && team.length > 0

  return (
    <div className={cn('grid w-full gap-6', showTeam && 'lg:grid-cols-2')}>
      <MyTargetActionsCard
        mine={data.mine}
        month={data.month}
        year={data.year}
      />
      {showTeam ? (
        <DepartmentSummaryCard
          team={team}
          month={data.month}
          year={data.year}
        />
      ) : null}
    </div>
  )
}
