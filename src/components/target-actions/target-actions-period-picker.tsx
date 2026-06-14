import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { TargetActionPeriod, TargetActionPeriodType } from '@/types'

const PRESETS: Array<{ value: TargetActionPeriodType; label: string }> = [
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

function currentIndex(type: TargetActionPeriodType): number {
  const now = new Date()
  if (type === 'month') return now.getMonth() + 1
  if (type === 'quarter') return Math.floor(now.getMonth() / 3) + 1
  return 0
}

function shiftPeriod(
  period: TargetActionPeriod,
  delta: number,
): TargetActionPeriod {
  if (period.type === 'year') {
    return { ...period, year: period.year + delta }
  }
  const max = period.type === 'month' ? 12 : 4
  let index = period.periodIndex + delta
  let year = period.year
  while (index < 1) {
    index += max
    year -= 1
  }
  while (index > max) {
    index -= max
    year += 1
  }
  return { type: period.type, year, periodIndex: index }
}

export function TargetActionsPeriodPicker({
  period,
  label,
  onChange,
}: {
  period: TargetActionPeriod
  label: string
  onChange: (period: TargetActionPeriod) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        value={period.type}
        onValueChange={(value) => {
          if (!value) return
          const type = value as TargetActionPeriodType
          onChange({ type, year: period.year, periodIndex: currentIndex(type) })
        }}
      >
        {PRESETS.map((preset) => (
          <ToggleGroupItem key={preset.value} value={preset.value}>
            {preset.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(shiftPeriod(period, -1))}
          aria-label="Предыдущий период"
        >
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-40 text-center text-sm font-medium capitalize">
          {label}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(shiftPeriod(period, 1))}
          aria-label="Следующий период"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
