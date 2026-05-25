import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { EntityActions } from './entity-actions'
import type { EntityConfig, EntityRowBase, RefusalReason } from './types'
import type { PipelineWithStages } from '@/types'
import { cn } from '@/lib/utils'

type EntityCardProps<TRow extends EntityRowBase, TFull> = {
  config: EntityConfig<TRow, TFull>
  row: TRow
  pipelines: PipelineWithStages[]
  refusalReasons: RefusalReason[]
  onOpen: (row: TRow) => void
  onDone?: () => void
  isDragOverlay?: boolean
}

function cardAccentColor(row: EntityRowBase): string {
  if (row.status === 'converted') return '#10b981'
  if (row.status === 'rejected') return '#ef4444'
  return row.departmentAccentColor ?? '#6b7280'
}

export function EntityCard<TRow extends EntityRowBase, TFull>({
  config,
  row,
  pipelines,
  refusalReasons,
  onOpen,
  onDone,
  isDragOverlay,
}: EntityCardProps<TRow, TFull>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: cardAccentColor(row),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(row)}
      className={cn(
        'group relative cursor-pointer rounded-lg border bg-card shadow-sm transition-shadow border-l-[3px]',
        row.status === 'converted' && 'bg-emerald-50/60 dark:bg-emerald-950/20',
        row.status === 'rejected' && 'bg-red-50/60 dark:bg-red-950/20',
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
              {row.title}
            </p>
            {row.companyName && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {row.companyName}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {config.renderCardFooter(row)}
        </div>

        {!isDragOverlay && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <EntityActions
              config={config}
              row={row}
              pipelines={pipelines}
              refusalReasons={refusalReasons}
              onDone={onDone}
            />
          </div>
        )}
      </div>
    </div>
  )
}
