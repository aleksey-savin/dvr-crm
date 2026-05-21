import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CalendarIcon } from 'lucide-react'
import { LeadActions } from './lead-actions'
import type { LeadRow, PipelineWithStages } from '@/types'
import { cn } from '@/lib/utils'

type LeadCardProps = {
  lead: LeadRow
  pipelines: PipelineWithStages[]
  refusalReasons: Array<{ id: string; name: string }>
  onOpen: (lead: LeadRow) => void
  onDone?: () => void
  isDragOverlay?: boolean
}

function statusBorderColor(lead: LeadRow): string {
  if (lead.status === 'converted') return '#10b981'
  if (lead.status === 'rejected') return '#ef4444'
  return lead.stageColor ?? '#6b7280'
}

export function LeadCard({
  lead,
  pipelines,
  refusalReasons,
  onOpen,
  onDone,
  isDragOverlay,
}: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: statusBorderColor(lead),
  }

  const isOverdue = lead.dueDate && new Date(lead.dueDate) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(lead)}
      className={cn(
        'group relative cursor-pointer rounded-lg border bg-card shadow-sm transition-shadow border-l-[3px]',
        lead.status === 'converted' &&
          'bg-emerald-50/60 dark:bg-emerald-950/20',
        lead.status === 'rejected' && 'bg-red-50/60 dark:bg-red-950/20',
        isDragging && !isDragOverlay && 'opacity-40',
        isDragOverlay && 'rotate-1 shadow-xl',
      )}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
          >
            <GripVertical className="size-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug">
              {lead.title}
            </p>
            {lead.companyName && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {lead.companyName}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {lead.responsibleUserName ?? '—'}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {lead.budget && (
              <span className="text-xs font-medium tabular-nums">
                {new Intl.NumberFormat('ru-RU', {
                  notation: 'compact',
                  currency: 'RUB',
                  style: 'currency',
                  maximumFractionDigits: 1,
                }).format(Number(lead.budget))}
              </span>
            )}
            {lead.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs',
                  isOverdue ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="size-3" />
                {new Date(lead.dueDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        </div>

        {!isDragOverlay && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <LeadActions
              lead={lead}
              pipelines={pipelines}
              refusalReasons={refusalReasons}
              context="card"
              onDone={onDone}
            />
          </div>
        )}
      </div>
    </div>
  )
}
