import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, TargetIcon, UsersIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TargetActionDashboard } from '@/types'

function completionBadge(planned: number, fact: number) {
  if (planned <= 0)
    return <span className="text-sm text-muted-foreground/40">—</span>
  const percent = Math.round((fact / planned) * 100)
  const variant =
    percent >= 100 ? 'success' : percent >= 50 ? 'warning' : 'secondary'
  return <Badge variant={variant}>{percent}%</Badge>
}

export function DashboardTargetActions({
  data,
}: {
  data: TargetActionDashboard
}) {
  const period = new Date(data.year, data.month - 1).toLocaleDateString(
    'ru-RU',
    { month: 'long', year: 'numeric' },
  )
  const mine = data.mine.filter((r) => r.plannedCount > 0 || r.factCount > 0)

  return (
    <>
      <Card className="rounded-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TargetIcon className="size-4" />
            Мои целевые действия · {period}
          </div>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/reports/target-actions"
                search={{ period: 'month', year: data.year, pi: data.month }}
              >
                Подробнее
                <ArrowRightIcon />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              План целевых действий на этот месяц не выставлен.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Целевое действие</TableHead>
                  <TableHead className="w-20 text-center">План</TableHead>
                  <TableHead className="w-20 text-center">Факт</TableHead>
                  <TableHead className="w-24 text-center">Выполнение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((row) => (
                  <TableRow key={row.typeId}>
                    <TableCell className="font-medium">
                      {row.typeName}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.plannedCount}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.factCount}
                    </TableCell>
                    <TableCell className="text-center">
                      {completionBadge(row.plannedCount, row.factCount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data.isHead && data.team && data.team.length > 0 ? (
        <Card className="rounded-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UsersIcon className="size-4" />
              Сводка по менеджерам · {period}
            </div>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link
                  to="/reports/target-actions"
                  search={{ period: 'month', year: data.year, pi: data.month }}
                >
                  Подробнее
                  <ArrowRightIcon />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Менеджер</TableHead>
                  <TableHead className="w-20 text-center">План</TableHead>
                  <TableHead className="w-20 text-center">Факт</TableHead>
                  <TableHead className="w-24 text-center">Выполнение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.team.map((manager) => (
                  <TableRow key={manager.userId}>
                    <TableCell className="font-medium">
                      {manager.userName}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {manager.totalPlanned}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {manager.totalFact}
                    </TableCell>
                    <TableCell className="text-center">
                      {completionBadge(manager.totalPlanned, manager.totalFact)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
