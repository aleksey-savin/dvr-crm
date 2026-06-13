import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ClientManagerMatrix } from '@/components/reports/client-manager-matrix'
import type { TargetClientsReport } from '@/types'

const nowYear = new Date().getFullYear()
const YEAR_OPTIONS = [nowYear - 1, nowYear, nowYear + 1]

export function TargetClientsReportView({
  report,
  year,
  onYearChange,
}: {
  report: TargetClientsReport
  year: number
  onYearChange: (year: number) => void
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">План / факт по менеджерам</h2>
        <ToggleGroup
          type="single"
          value={String(year)}
          onValueChange={(value) => {
            if (value) onYearChange(Number(value))
          }}
          variant="outline"
        >
          {YEAR_OPTIONS.map((option) => (
            <ToggleGroupItem key={option} value={String(option)}>
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <ClientManagerMatrix
        title="Целевые клиенты"
        managers={report.managers}
        data={report.target}
        lastYear={report.lastYear}
        year={report.year}
      />

      <ClientManagerMatrix
        title="Нецелевые клиенты"
        managers={report.managers}
        data={report.nontarget}
        lastYear={report.lastYear}
        year={report.year}
      />
    </div>
  )
}
