import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BarChart3Icon } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { useDepartmentStore } from '@/stores/department-store'
import { fetchTargetClientsReport } from '@/components/reports/actions'
import { TargetClientsReportView } from '@/components/reports/target-clients-report-view'

export const Route = createFileRoute('/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)
  const departments = useDepartmentStore((s) => s.departments)
  const selectedDept = departments.find((d) => d.id === selectedDepartmentId)
  const isSales = selectedDept?.departmentType === 'sales'

  const [year, setYear] = React.useState(new Date().getFullYear())

  const { data: report, isLoading } = useQuery({
    queryKey: ['target-clients-report', selectedDepartmentId, year],
    queryFn: () =>
      fetchTargetClientsReport({
        data: { departmentId: selectedDepartmentId!, year },
      }),
    enabled: Boolean(selectedDepartmentId) && isSales,
  })

  if (!selectedDepartmentId || !isSales) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3Icon />
          </EmptyMedia>
        </EmptyHeader>
        <EmptyDescription>
          Выберите продающее подразделение (бизнес-юнит) в переключателе сверху
          — отчёт строится по одному бизнес-юниту, как вкладки ГКС / БОЛТ /
          RUSAPAI.
        </EmptyDescription>
      </Empty>
    )
  }

  if (isLoading || !report) {
    return <p className="text-sm text-muted-foreground">Загрузка отчёта…</p>
  }

  return (
    <TargetClientsReportView
      report={report}
      year={year}
      onYearChange={setYear}
    />
  )
}
