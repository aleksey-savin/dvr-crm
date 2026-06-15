import { ClientManagerMatrix } from '@/components/reports/client-manager-matrix'
import type { TargetClientsReport } from '@/types'

export function TargetClientsReportView({
  report,
}: {
  report: TargetClientsReport
}) {
  return (
    <div className="flex w-full flex-col gap-8">
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
