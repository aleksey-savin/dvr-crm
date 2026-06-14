import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import type {
  TargetActionAnalyticsRow,
  TargetActionAnalyticsType,
} from '@/types'

// Distinct colour per target-action type: the 5 theme chart tokens first, then
// evenly-spread oklch hues so any number of types stays visually separable.
function typeColor(index: number): string {
  const tokens = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]
  if (index < tokens.length) return tokens[index]
  const hue = (index * 47) % 360
  return `oklch(0.68 0.14 ${hue})`
}

/** «Иванов Иван Петрович» → «Иванов И.» */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1].charAt(0)}.`
}

type ChartPoint = Record<string, string | number>

/**
 * Tooltip for a single hovered stack (план OR факт), broken down by type.
 * Reconstructs the whole stack from the data point so it isn't overloaded with
 * both stacks at once.
 */
function StackTooltip({
  active,
  payload,
  types,
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; payload?: ChartPoint }>
  types: TargetActionAnalyticsType[]
}) {
  const first = payload?.[0]
  if (!active || !first?.payload) return null

  const dataKey = String(first.dataKey)
  const stack = dataKey.startsWith('plan_') ? 'plan' : 'fact'
  const point = first.payload
  const title = stack === 'plan' ? 'План' : 'Факт'

  const items = types
    .map((type, index) => ({
      name: type.name,
      color: typeColor(index),
      value: Number(point[`${stack}_${type.id}`] ?? 0),
    }))
    .filter((item) => item.value > 0)

  return (
    <div className="min-w-40 rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <div className="mb-1.5 font-medium">
        {point.name} · {title}
      </div>
      {items.length === 0 ? (
        <div className="text-muted-foreground">Нет данных</div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ background: item.color }}
              />
              <span className="flex-1 truncate">{item.name}</span>
              <span className="font-medium tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TargetActionsChart({
  rows,
  types,
}: {
  rows: TargetActionAnalyticsRow[]
  types: TargetActionAnalyticsType[]
}) {
  // Two stacks per manager: «план» (muted) and «факт» (solid), each segmented
  // by target-action type with the type's colour.
  const chartConfig: ChartConfig = {}
  types.forEach((type, index) => {
    const color = typeColor(index)
    chartConfig[`plan_${type.id}`] = { label: `${type.name} · план`, color }
    chartConfig[`fact_${type.id}`] = { label: `${type.name} · факт`, color }
  })

  const data: ChartPoint[] = rows.map((row) => {
    const point: ChartPoint = { name: shortName(row.userName) }
    for (const type of types) {
      point[`plan_${type.id}`] = row.cells[type.id].planned
      point[`fact_${type.id}`] = row.cells[type.id].fact
    }
    return point
  })

  const lastType = types.length - 1

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip
          shared={false}
          cursor={{ fillOpacity: 0.1 }}
          content={<StackTooltip types={types} />}
        />
        {types.map((type, index) => (
          <Bar
            key={`plan-${type.id}`}
            dataKey={`plan_${type.id}`}
            stackId="plan"
            fill={`var(--color-plan_${type.id})`}
            fillOpacity={0.4}
            radius={index === lastType ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
        {types.map((type, index) => (
          <Bar
            key={`fact-${type.id}`}
            dataKey={`fact_${type.id}`}
            stackId="fact"
            fill={`var(--color-fact_${type.id})`}
            radius={index === lastType ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
