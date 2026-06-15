import type {
  TargetActionAnalytics,
  TargetActionAnalyticsRow,
  TargetActionAnalyticsType,
} from '@/types'

type BadgeVariant = 'secondary' | 'success' | 'warning' | 'destructive'

export const numberFmt = new Intl.NumberFormat('ru-RU')

/** Completion %: fact/plan rounded, or null when there is no plan. */
export function completionPercent(
  fact: number,
  planned: number,
): number | null {
  return planned > 0 ? Math.round((fact / planned) * 100) : null
}

/** Recompute matrix totals from a (client-filtered) subset of manager rows. */
export function recomputeTotals(
  rows: TargetActionAnalyticsRow[],
  types: TargetActionAnalyticsType[],
): TargetActionAnalytics['totals'] {
  const byType: TargetActionAnalytics['totals']['byType'] = {}
  for (const t of types) byType[t.id] = { planned: 0, fact: 0, percent: null }

  let totalPlanned = 0
  let totalFact = 0
  for (const row of rows) {
    totalPlanned += row.totalPlanned
    totalFact += row.totalFact
    for (const t of types) {
      const cell = row.cells[t.id]
      byType[t.id].planned += cell.planned
      byType[t.id].fact += cell.fact
    }
  }
  for (const t of types)
    byType[t.id].percent = completionPercent(
      byType[t.id].fact,
      byType[t.id].planned,
    )

  return {
    byType,
    totalPlanned,
    totalFact,
    overallPercent: completionPercent(totalFact, totalPlanned),
  }
}

export function percentLabel(percent: number | null) {
  return percent === null ? '—' : `${percent}%`
}

/** Color accent for a completion %: green ≥100, amber ≥60, red below, neutral when no plan. */
export function completionVariant(percent: number | null): BadgeVariant {
  if (percent === null) return 'secondary'
  if (percent >= 100) return 'success'
  if (percent >= 60) return 'warning'
  return 'destructive'
}

/** Fill color for a <CompletionBar>, mirroring completionVariant thresholds. */
export function completionBarColor(percent: number | null): string {
  if (percent === null) return 'bg-muted-foreground/30'
  if (percent >= 100) return 'bg-emerald-600'
  if (percent >= 60) return 'bg-amber-500'
  return 'bg-destructive'
}
