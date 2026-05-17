import { CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TargetActionRow, TargetActionStatus } from '@/types'
import { cn } from '@/lib/utils'

type Props = {
  actions: TargetActionRow[]
}

const STATUS_LABELS: Record<TargetActionStatus, string> = {
  planned: 'Запланировано',
  completed: 'Выполнено',
  cancelled: 'Отменено',
}

const STATUS_VARIANTS: Record<
  TargetActionStatus,
  'secondary' | 'success' | 'destructive'
> = {
  planned: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
}

function formatActionDate(a: TargetActionRow): string {
  const d = a.completedAt ?? new Date(a.plannedAt)
  return new Date(d).toLocaleDateString('ru-RU')
}

export function InitiativeActionsSection({ actions }: Props) {
  if (actions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Целевых действий ещё нет — они появятся автоматически при проведении
        встреч, отправке КП и других значимых событиях.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {actions.map((a) => (
        <li key={a.id} className="flex flex-col gap-1 rounded-md border p-2">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{a.typeName}</span>
                <Badge
                  variant={STATUS_VARIANTS[a.status]}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {STATUS_LABELS[a.status]}
                </Badge>
              </div>
              <div
                className={cn(
                  'mt-0.5 flex items-center gap-2 text-xs text-muted-foreground',
                )}
              >
                <span className="flex items-center gap-0.5">
                  <CalendarIcon className="size-3" />
                  {formatActionDate(a)}
                </span>
                {a.responsibleUserName && <span>· {a.responsibleUserName}</span>}
              </div>
            </div>
          </div>
          {a.reason && (
            <p className="rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
              <span className="font-medium">Причина:</span> {a.reason}
            </p>
          )}
          {a.result && (
            <p className="rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
              {a.result}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
