import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3Icon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { useDepartmentStore } from '@/stores/department-store'
import { fetchTargetClientsReport } from '@/components/reports/actions'
import { TargetClientsReportView } from '@/components/reports/target-clients-report-view'

const nowYear = new Date().getFullYear()
const YEAR_OPTIONS = [nowYear - 1, nowYear, nowYear + 1]

export function PlanFactReport() {
  const globalDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)
  const departments = useDepartmentStore((s) => s.departments)
  const salesDepartments = departments.filter(
    (d) => d.departmentType === 'sales',
  )

  // Default to the current global scope; the in-report filter then drives the
  // report independently of the global business-unit switcher.
  const [departmentId, setDepartmentId] = React.useState<string | null>(
    globalDepartmentId,
  )
  const [year, setYear] = React.useState(nowYear)

  const selectedDept = salesDepartments.find((d) => d.id === departmentId)

  const { data: report, isLoading } = useQuery({
    queryKey: ['target-clients-report', departmentId, year],
    queryFn: () =>
      fetchTargetClientsReport({
        data: { departmentId: departmentId!, year },
      }),
    enabled: Boolean(selectedDept),
  })

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold">План / факт по менеджерам</h2>
        <div className="flex flex-wrap items-center gap-2">
          {salesDepartments.length > 0 && (
            <ToggleGroup
              type="single"
              value={departmentId ?? ''}
              onValueChange={(value) => {
                if (value) setDepartmentId(value)
              }}
              variant="outline"
            >
              {salesDepartments.map((dept) => (
                <ToggleGroupItem key={dept.id} value={dept.id}>
                  {dept.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
          <ToggleGroup
            type="single"
            value={String(year)}
            onValueChange={(value) => {
              if (value) setYear(Number(value))
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
      </div>

      {selectedDept ? (
        isLoading || !report ? (
          <p className="text-sm text-muted-foreground">Загрузка отчёта…</p>
        ) : (
          <TargetClientsReportView report={report} />
        )
      ) : salesDepartments.length > 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BarChart3Icon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>
            Выберите бизнес-юнит в фильтре выше — отчёт строится по одному
            бизнес-юниту, как вкладки ГКС / БОЛТ / RUSAPAI.
          </EmptyDescription>
        </Empty>
      ) : (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      )}
    </div>
  )
}
