import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  TargetIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { useDepartmentStore } from '@/stores/department-store'
import {
  setTargetActionPlanApproval,
  upsertTargetActionPlan,
} from '@/components/target-actions/actions'
import type { TargetActionPlanRow, TargetActionReport } from '@/types'

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

type ManagerGroup = {
  userId: string
  userName: string
  rows: TargetActionPlanRow[]
  approved: boolean
  hasPlan: boolean
}

function groupByManager(rows: TargetActionPlanRow[]): ManagerGroup[] {
  const map = new Map<string, TargetActionPlanRow[]>()
  for (const row of rows) {
    const list = map.get(row.userId) ?? []
    list.push(row)
    map.set(row.userId, list)
  }
  return Array.from(map.values())
    .map((list) => {
      const planned = list.filter((r) => r.planId)
      return {
        userId: list[0].userId,
        userName: list[0].userName,
        rows: list,
        hasPlan: planned.length > 0,
        approved:
          planned.length > 0 && planned.every((r) => r.status === 'approved'),
      }
    })
    .sort((a, b) => a.userName.localeCompare(b.userName, 'ru'))
}

export function TargetActionsReportView({
  report,
  onPeriodChange,
}: {
  report: TargetActionReport
  onPeriodChange: (year: number, month: number) => void
}) {
  const router = useRouter()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)

  const rows = selectedDepartmentId
    ? report.rows.filter((r) => r.departmentId === selectedDepartmentId)
    : report.rows
  const groups = groupByManager(rows)

  const shiftPeriod = (delta: number) => {
    const zero = report.month - 1 + delta
    const year = report.year + Math.floor(zero / 12)
    const month = ((zero % 12) + 12) % 12
    onPeriodChange(year, month + 1)
  }

  const savePlan = async (row: TargetActionPlanRow, plannedCount: number) => {
    try {
      await upsertTargetActionPlan({
        data: {
          userId: row.userId,
          typeId: row.typeId,
          year: report.year,
          month: report.month,
          plannedCount,
        },
      })
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось сохранить план',
      )
    }
  }

  const setApproval = async (userId: string, approved: boolean) => {
    try {
      await setTargetActionPlanApproval({
        data: { userId, year: report.year, month: report.month, approved },
      })
      toast.success(approved ? 'План согласован' : 'Согласование снято')
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось изменить статус',
      )
    }
  }

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => shiftPeriod(-1)}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-40 text-center text-base font-medium">
          {MONTHS[report.month - 1]} {report.year}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => shiftPeriod(1)}
          aria-label="Следующий месяц"
        >
          <ChevronRightIcon />
        </Button>
      </div>

      {groups.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TargetIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет данных за выбранный период</EmptyDescription>
        </Empty>
      ) : (
        groups.map((group) => (
          <ManagerCard
            key={group.userId}
            group={group}
            canManage={report.canManageOthers}
            onSavePlan={savePlan}
            onApprove={setApproval}
          />
        ))
      )}
    </div>
  )
}

function ManagerCard({
  group,
  canManage,
  onSavePlan,
  onApprove,
}: {
  group: ManagerGroup
  canManage: boolean
  onSavePlan: (row: TargetActionPlanRow, plannedCount: number) => void
  onApprove: (userId: string, approved: boolean) => void
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          {group.userName}
          {group.hasPlan ? (
            group.approved ? (
              <Badge variant="success">Согласован</Badge>
            ) : (
              <Badge variant="warning">На согласовании</Badge>
            )
          ) : null}
        </CardTitle>
        {canManage && group.hasPlan ? (
          group.approved ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove(group.userId, false)}
            >
              <RotateCcwIcon className="size-4" />
              Снять согласование
            </Button>
          ) : (
            <Button size="sm" onClick={() => onApprove(group.userId, true)}>
              <CheckCircle2Icon className="size-4" />
              Согласовать
            </Button>
          )
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Целевое действие</TableHead>
              <TableHead className="w-28 text-center">План</TableHead>
              <TableHead className="w-20 text-center">Факт</TableHead>
              <TableHead className="w-24 text-center">Выполнение</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.rows.map((row) => (
              <TableRow key={row.typeId}>
                <TableCell className="font-medium">{row.typeName}</TableCell>
                <TableCell className="text-center">
                  <PlanCell row={row} onSave={onSavePlan} />
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.factCount}
                </TableCell>
                <TableCell className="text-center">
                  <CompletionBadge
                    planned={row.plannedCount}
                    fact={row.factCount}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function PlanCell({
  row,
  onSave,
}: {
  row: TargetActionPlanRow
  onSave: (row: TargetActionPlanRow, plannedCount: number) => void
}) {
  const [value, setValue] = React.useState(String(row.plannedCount))
  React.useEffect(() => setValue(String(row.plannedCount)), [row.plannedCount])

  const commit = () => {
    const next = Math.round(Number(value))
    if (!Number.isFinite(next) || next < 0) {
      setValue(String(row.plannedCount))
      return
    }
    if (next !== row.plannedCount) onSave(row, next)
  }

  return (
    <Input
      type="number"
      min={0}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      className="mx-auto h-8 w-20 text-center"
    />
  )
}

function CompletionBadge({ planned, fact }: { planned: number; fact: number }) {
  if (planned <= 0)
    return <span className="text-sm text-muted-foreground/40">—</span>
  const percent = Math.round((fact / planned) * 100)
  const variant =
    percent >= 100 ? 'success' : percent >= 50 ? 'warning' : 'secondary'
  return <Badge variant={variant}>{percent}%</Badge>
}
