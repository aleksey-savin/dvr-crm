import { createFileRoute } from '@tanstack/react-router'
import {
  fetchManagerReportDetail,
  fetchTargetActionsAnalytics,
} from '@/components/target-actions/actions'
import { TargetActionsAnalyticsView } from '@/components/target-actions/target-actions-analytics-view'
import type { TargetActionPeriodType } from '@/types'

type TargetActionsSearch = {
  period: TargetActionPeriodType
  year: number
  pi: number
  manager?: string
}

const PERIODS: TargetActionPeriodType[] = ['month', 'quarter', 'year']

function defaultIndex(period: TargetActionPeriodType): number {
  const now = new Date()
  if (period === 'month') return now.getMonth() + 1
  if (period === 'quarter') return Math.floor(now.getMonth() / 3) + 1
  return 0
}

export const Route = createFileRoute('/reports_/target-actions')({
  validateSearch: (search: Record<string, unknown>): TargetActionsSearch => {
    const period = PERIODS.includes(search.period as TargetActionPeriodType)
      ? (search.period as TargetActionPeriodType)
      : 'quarter'
    const year =
      typeof search.year === 'number' ? search.year : new Date().getFullYear()
    const max = period === 'month' ? 12 : period === 'quarter' ? 4 : 0
    let pi = typeof search.pi === 'number' ? search.pi : defaultIndex(period)
    if (period === 'year') pi = 0
    else if (pi < 1 || pi > max) pi = defaultIndex(period)
    return {
      period,
      year,
      pi,
      manager: typeof search.manager === 'string' ? search.manager : undefined,
    }
  },
  loaderDeps: ({ search }) => ({
    period: search.period,
    year: search.year,
    pi: search.pi,
    manager: search.manager,
  }),
  loader: async ({ deps }) => {
    const periodIndex = deps.period === 'year' ? 0 : deps.pi
    const analytics = await fetchTargetActionsAnalytics({
      data: { type: deps.period, year: deps.year, periodIndex },
    })
    let detail = null
    if (deps.manager) {
      try {
        detail = await fetchManagerReportDetail({
          data: {
            userId: deps.manager,
            type: deps.period,
            year: deps.year,
            periodIndex,
          },
        })
      } catch {
        detail = null
      }
    }
    return { analytics, detail }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { analytics, detail } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  return (
    <TargetActionsAnalyticsView
      analytics={analytics}
      detail={detail}
      onPeriodChange={(period) =>
        navigate({
          search: (prev) => ({
            ...prev,
            period: period.type,
            year: period.year,
            pi: period.periodIndex,
          }),
        })
      }
      onSelectManager={(userId) =>
        navigate({ search: (prev) => ({ ...prev, manager: userId }) })
      }
      onCloseManager={() =>
        navigate({ search: (prev) => ({ ...prev, manager: undefined }) })
      }
    />
  )
}
