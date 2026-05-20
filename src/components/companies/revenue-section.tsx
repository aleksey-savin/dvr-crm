import { toast } from 'sonner'
import { TrendingUpIcon, PlusIcon, Settings2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Section,
  YearValueDialog,
  DeleteRowButton,
} from '@/components/companyAccounts/client-view/shared'
import { addRevenue, deleteRevenue } from '@/components/companies/actions'
import type { Revenue } from '@/types'

type Props = {
  revenues: Revenue[]
  companyId: string
  onRefresh: () => void
  variant?: 'summary' | 'chart'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtNum = (v: string) =>
  Number(v).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

const fmtChartNum = (v: string) => {
  const value = Number(v)
  const abs = Math.abs(value)
  const format = (divider: number, suffix: string) =>
    `${(value / divider).toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })} ${suffix}`

  if (abs >= 1_000_000_000) return format(1_000_000_000, 'млрд')
  if (abs >= 1_000_000) return format(1_000_000, 'млн')

  return fmtNum(v)
}

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

function RevenueChart({
  revenues,
  size = 'full',
}: {
  revenues: Revenue[]
  size?: 'compact' | 'full'
}) {
  const isCompact = size === 'compact'
  const sorted = revenues.slice().sort((a, b) => a.year - b.year)
  const values = sorted.map((r) => Number(r.value))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const isFlat = min === max

  const width = isCompact ? 360 : 720
  const height = isCompact ? 72 : 260
  const left = isCompact ? 10 : 36
  const right = isCompact ? 10 : 36
  const top = isCompact ? 8 : 40
  const bottom = isCompact ? 10 : 42
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const xFor = (index: number) =>
    sorted.length === 1
      ? left + plotWidth / 2
      : left + (index / (sorted.length - 1)) * plotWidth

  const yFor = (value: number) =>
    isFlat
      ? top + plotHeight / 2
      : top + ((max - value) / (max - min)) * plotHeight

  const points = sorted.map((r, index) => ({
    revenue: r,
    label: fmtChartNum(r.value),
    x: xFor(index),
    y: yFor(Number(r.value)),
  }))

  return (
    <div
      className={
        isCompact
          ? 'h-12 w-full overflow-hidden'
          : 'h-72 w-full overflow-hidden rounded-md border bg-muted/20 px-3 py-3'
      }
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="График выручки компании по годам"
      >
        {!isCompact &&
          [0, 0.5, 1].map((ratio) => {
            const y = top + ratio * plotHeight
            return (
              <line
                key={ratio}
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeDasharray={ratio === 1 ? undefined : '4 6'}
              />
            )
          })}

        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth={isCompact ? '2.5' : '3'}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            className="text-primary"
          />
        )}

        {points.map((point, index) => {
          if (isCompact) {
            return (
              <circle
                key={point.revenue.id}
                cx={point.x}
                cy={point.y}
                r={index === points.length - 1 ? '3.5' : '2'}
                className="fill-primary"
              />
            )
          }

          const labelWidth = Math.max(46, point.label.length * 6.4 + 10)
          const labelX = Math.min(
            width - right - labelWidth / 2,
            Math.max(left + labelWidth / 2, point.x),
          )
          const labelY = Math.max(18, point.y - 16)

          return (
            <g key={point.revenue.id}>
              <line
                x1={point.x}
                x2={point.x}
                y1={point.y + 8}
                y2={top + plotHeight}
                className="stroke-border"
                strokeDasharray="3 7"
              />
              <rect
                x={labelX - labelWidth / 2}
                y={labelY - 14}
                width={labelWidth}
                height="19"
                rx="5"
                className="fill-background stroke-border"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-medium"
              >
                {point.label}
              </text>
              <circle
                cx={point.x}
                cy={point.y}
                r="5.5"
                className="fill-primary stroke-background"
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={height - 14}
                textAnchor={
                  index === 0
                    ? 'start'
                    : index === points.length - 1
                      ? 'end'
                      : 'middle'
                }
                className="fill-muted-foreground text-[10px]"
              >
                {point.revenue.year}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ChartRevenueSection({ revenues, companyId, onRefresh }: Props) {
  const latestRevenue = revenues
    .slice()
    .sort((a, b) => b.year - a.year)
    .at(0)

  return (
    <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
      <div className="w-72 max-w-full min-w-0 sm:w-80">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUpIcon className="size-3.5 shrink-0" />
            <span>Выручка</span>
          </div>
          {latestRevenue && (
            <div className="shrink-0 text-xs font-medium">
              {latestRevenue.year}: {fmtChartNum(latestRevenue.value)}
            </div>
          )}
        </div>

        {revenues.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Данных нет</p>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="block w-full cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Открыть график выручки"
              >
                <RevenueChart revenues={revenues} size="compact" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Выручка компании</DialogTitle>
              </DialogHeader>
              <RevenueChart revenues={revenues} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="shrink-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Settings2Icon className="size-3.5" />
              Управлять
            </Button>
          </DialogTrigger>
          <ManageDialog
            revenues={revenues}
            companyId={companyId}
            onRefresh={onRefresh}
          />
        </Dialog>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Manage dialog
// ---------------------------------------------------------------------------

function ManageDialog({ revenues, companyId, onRefresh }: Props) {
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Выручка компании</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-1">
        <Section
          icon={TrendingUpIcon}
          title="Выручка по годам"
          action={
            <YearValueDialog
              title="Добавить выручку"
              onAdd={async (year, value) => {
                await addRevenue({ data: { companyId, year, value } })
                toast.success('Запись добавлена')
                onRefresh()
              }}
            >
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusIcon className="size-3.5" />
                Добавить
              </Button>
            </YearValueDialog>
          }
        >
          {revenues.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Данных нет
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Год</TableHead>
                  <TableHead>Выручка</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues
                  .slice()
                  .sort((a, b) => b.year - a.year)
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.year}</TableCell>
                      <TableCell>{fmtNum(r.value)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {fmtDate(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DeleteRowButton
                          onDelete={async () => {
                            await deleteRevenue({ data: { id: r.id } })
                            toast.success('Запись удалена')
                            onRefresh()
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>
    </DialogContent>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function RevenueSection({
  revenues,
  companyId,
  onRefresh,
  variant = 'summary',
}: Props) {
  if (variant === 'chart') {
    return (
      <ChartRevenueSection
        revenues={revenues}
        companyId={companyId}
        onRefresh={onRefresh}
      />
    )
  }

  const currentYear = new Date().getFullYear()
  const lastYearRevenue = revenues.find((r) => r.year === currentYear - 1)
  const twoYearsAgoRevenue = revenues.find((r) => r.year === currentYear - 2)

  return (
    <div className="flex items-start gap-3">
      {/* Summary cards */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Card className="flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUpIcon className="size-3.5" />
            Выручка {currentYear - 2}
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {twoYearsAgoRevenue ? (
              fmtNum(twoYearsAgoRevenue.value)
            ) : (
              <span className="text-muted-foreground text-base font-normal">
                Нет данных
              </span>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUpIcon className="size-3.5" />
            Выручка {currentYear - 1}
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {lastYearRevenue ? (
              fmtNum(lastYearRevenue.value)
            ) : (
              <span className="text-muted-foreground text-base font-normal">
                Нет данных
              </span>
            )}
          </div>
          {twoYearsAgoRevenue &&
            lastYearRevenue &&
            (() => {
              const base = Number(twoYearsAgoRevenue.value)
              if (base === 0) return null
              const pct =
                ((Number(lastYearRevenue.value) - base) / Math.abs(base)) * 100
              const positive = pct >= 0
              return (
                <div
                  className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${
                    positive ? 'text-emerald-600' : 'text-destructive'
                  }`}
                >
                  <TrendingUpIcon className="size-3.5 shrink-0" />
                  {positive ? '+' : ''}
                  {pct.toFixed(1)}% к {currentYear - 2}
                </div>
              )
            })()}
        </Card>
      </div>

      {/* Manage button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start mt-0.5 shrink-0"
          >
            <Settings2Icon className="size-3.5" />
            Управлять
          </Button>
        </DialogTrigger>
        <ManageDialog
          revenues={revenues}
          companyId={companyId}
          onRefresh={onRefresh}
        />
      </Dialog>
    </div>
  )
}
