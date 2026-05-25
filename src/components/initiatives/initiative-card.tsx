import { Link } from '@tanstack/react-router'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CalendarIcon, PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { InitiativeRow } from '@/types'
import { cn } from '@/lib/utils'

type InitiativeCardProps = {
  initiative: InitiativeRow
  isDragOverlay?: boolean
}

export function InitiativeCard({
  initiative,
  isDragOverlay,
}: InitiativeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: initiative.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue =
    initiative.dueDate && new Date(initiative.dueDate) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftColor: initiative.departmentAccentColor ?? '#6b7280',
      }}
      className={cn(
        'group relative rounded-lg border bg-card shadow-sm transition-shadow',
        'border-l-[3px]',
        isDragging && !isDragOverlay && 'opacity-40',
        isDragOverlay && 'rotate-1 shadow-xl',
      )}
    >
      <div className="p-3">
        {/* Drag handle + title row */}
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
          >
            <GripVertical className="size-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <Link
              to="/initiatives/$id/view"
              params={{ id: initiative.id }}
              className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
            >
              {initiative.title}
            </Link>

            {initiative.companyName && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {initiative.companyName}
              </p>
            )}
          </div>

          {/* Edit button on hover */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Link to="/initiatives/$id/update" params={{ id: initiative.id }}>
              <PencilIcon className="size-3" />
            </Link>
          </Button>
        </div>

        {/* Footer row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {/* Responsible */}
          <span className="truncate text-xs text-muted-foreground">
            {initiative.responsibleUserName ?? '—'}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            {/* Budget */}
            {initiative.budget && (
              <span className="text-xs font-medium tabular-nums">
                {new Intl.NumberFormat('ru-RU', {
                  notation: 'compact',
                  currency: 'RUB',
                  style: 'currency',
                  maximumFractionDigits: 1,
                }).format(Number(initiative.budget))}
              </span>
            )}

            {/* Due date */}
            {initiative.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs',
                  isOverdue ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="size-3" />
                {new Date(initiative.dueDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
