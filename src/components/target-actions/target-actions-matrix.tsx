import * as React from 'react'
import { ArrowUpDownIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { completionVariant, numberFmt, percentLabel } from './report-utils'
import type { TargetActionAnalytics, TargetActionAnalyticsRow } from '@/types'

type SortKey = 'name' | 'overall' | string // string = typeId
type SortState = { key: SortKey; dir: 'asc' | 'desc' }

/** Числовая сортировка: null всегда внизу; ничья — по факту убыв. */
function compareNumberNullsLast(
  aVal: number | null,
  bVal: number | null,
  aFact: number,
  bFact: number,
  dir: 'asc' | 'desc',
) {
  if (aVal === null && bVal === null) return bFact - aFact
  if (aVal === null) return 1
  if (bVal === null) return -1
  if (aVal !== bVal) return (aVal - bVal) * (dir === 'asc' ? 1 : -1)
  return bFact - aFact
}

function sortRows(rows: TargetActionAnalyticsRow[], sort: SortState) {
  const sorted = [...rows]
  sorted.sort((a, b) => {
    if (sort.key === 'name') {
      return (
        a.userName.localeCompare(b.userName, 'ru') *
        (sort.dir === 'asc' ? 1 : -1)
      )
    }
    if (sort.key === 'overall') {
      return compareNumberNullsLast(
        a.overallPercent,
        b.overallPercent,
        a.totalFact,
        b.totalFact,
        sort.dir,
      )
    }
    const aCell = a.cells[sort.key]
    const bCell = b.cells[sort.key]
    return compareNumberNullsLast(
      aCell.percent,
      bCell.percent,
      aCell.fact,
      bCell.fact,
      sort.dir,
    )
  })
  return sorted
}

function SortButton({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 hover:text-foreground',
        className,
      )}
    >
      {children}
      <ArrowUpDownIcon
        className={cn('size-3', active ? 'opacity-100' : 'opacity-30')}
      />
    </button>
  )
}

export function TargetActionsMatrix({
  analytics,
  onSelectManager,
}: {
  analytics: TargetActionAnalytics
  onSelectManager: (userId: string) => void
}) {
  const [sort, setSort] = React.useState<SortState>({
    key: 'overall',
    dir: 'desc',
  })

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    )

  const { types, totals } = analytics
  const rows = sortRows(analytics.rows, sort)

  const stickyHead = 'sticky left-0 z-20 bg-muted/50 min-w-44 border-r'
  const stickyCell =
    'sticky left-0 z-10 bg-background min-w-44 border-r group-hover:bg-muted/50'
  const stickyFoot = 'sticky left-0 z-10 bg-muted/50 min-w-44 border-r'

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className={cn(stickyHead, 'align-middle')}>
              <SortButton
                active={sort.key === 'name'}
                onClick={() => toggleSort('name')}
              >
                Менеджер
              </SortButton>
            </TableHead>
            {types.map((type) => (
              <TableHead
                key={type.id}
                colSpan={3}
                className="border-l text-center font-medium"
              >
                {type.name}
              </TableHead>
            ))}
            <TableHead
              rowSpan={2}
              className="border-l text-center align-middle font-medium"
            >
              <SortButton
                active={sort.key === 'overall'}
                onClick={() => toggleSort('overall')}
                className="justify-center"
              >
                Выполнение
              </SortButton>
            </TableHead>
          </TableRow>
          <TableRow>
            {types.map((type) => (
              <React.Fragment key={type.id}>
                <TableHead className="border-l text-center text-xs font-medium text-muted-foreground">
                  План
                </TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground">
                  Факт
                </TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground">
                  <SortButton
                    active={sort.key === type.id}
                    onClick={() => toggleSort(type.id)}
                    className="justify-center"
                  >
                    %
                  </SortButton>
                </TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.userId}
              className="group cursor-pointer"
              onClick={() => onSelectManager(row.userId)}
            >
              <TableCell className={cn(stickyCell, 'font-medium')}>
                {row.userName}
              </TableCell>
              {types.map((type) => {
                const cell = row.cells[type.id]
                return (
                  <React.Fragment key={type.id}>
                    <TableCell className="border-l text-center tabular-nums text-muted-foreground">
                      {type.isPlannable ? numberFmt.format(cell.planned) : '—'}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {numberFmt.format(cell.fact)}
                    </TableCell>
                    <TableCell className="text-center">
                      {type.isPlannable ? (
                        <Badge variant={completionVariant(cell.percent)}>
                          {percentLabel(cell.percent)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </React.Fragment>
                )
              })}
              <TableCell className="border-l text-center">
                <Badge variant={completionVariant(row.overallPercent)}>
                  {percentLabel(row.overallPercent)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell className={cn(stickyFoot, 'font-semibold')}>
              Итого
            </TableCell>
            {types.map((type) => {
              const t = totals.byType[type.id]
              return (
                <React.Fragment key={type.id}>
                  <TableCell className="border-l text-center tabular-nums text-muted-foreground">
                    {type.isPlannable ? numberFmt.format(t.planned) : '—'}
                  </TableCell>
                  <TableCell className="text-center tabular-nums font-medium">
                    {numberFmt.format(t.fact)}
                  </TableCell>
                  <TableCell className="text-center">
                    {type.isPlannable ? (
                      <Badge variant={completionVariant(t.percent)}>
                        {percentLabel(t.percent)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </React.Fragment>
              )
            })}
            <TableCell className="border-l text-center">
              <Badge variant={completionVariant(totals.overallPercent)}>
                {percentLabel(totals.overallPercent)}
              </Badge>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
