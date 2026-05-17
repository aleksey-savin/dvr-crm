import * as React from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  deletePipelineStage,
  updatePipelineStage,
} from '@/components/pipelines/actions'
import { InitiativeCard } from './initiative-card'
import type { InitiativeRow, PipelineStageOption } from '@/types'
import { cn } from '@/lib/utils'

export const STAGE_COLORS = [
  '#6b7280',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#06b6d4',
  '#ec4899',
  '#f97316',
  '#84cc16',
]

type KanbanColumnProps = {
  stage: PipelineStageOption
  initiatives: InitiativeRow[]
}

export function KanbanColumn({ stage, initiatives }: KanbanColumnProps) {
  const router = useRouter()
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState(stage.name)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  // Sortable for the column itself — prefixed id so it doesn't collide with
  // card ids inside this column.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `col-${stage.id}` })

  // Droppable for cards landing in this stage.
  const { setNodeRef: setCardsRef, isOver } = useDroppable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const totalBudget = initiatives.reduce(
    (sum, i) => sum + (i.budget ? Number(i.budget) : 0),
    0,
  )

  const commitRename = async () => {
    const trimmed = nameDraft.trim()
    setIsRenaming(false)
    if (!trimmed || trimmed === stage.name) {
      setNameDraft(stage.name)
      return
    }
    try {
      await updatePipelineStage({ data: { id: stage.id, name: trimmed } })
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось переименовать',
      )
      setNameDraft(stage.name)
    }
  }

  const changeColor = async (color: string) => {
    if (color === stage.color) return
    try {
      await updatePipelineStage({ data: { id: stage.id, color } })
      await router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить цвет')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePipelineStage({ data: { id: stage.id } })
      toast.success('Колонка удалена')
      await router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить')
    } finally {
      setConfirmDelete(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/column flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover/column:opacity-100"
          {...attributes}
          {...listeners}
          aria-label="Переместить колонку"
        >
          <GripVerticalIcon className="size-3.5" />
        </button>
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        {isRenaming ? (
          <Input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void commitRename()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setNameDraft(stage.name)
                setIsRenaming(false)
              }
            }}
            autoFocus
            className="h-7 flex-1 text-sm font-medium"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setIsRenaming(true)}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-foreground"
            title="Двойной клик для переименования"
          >
            {stage.name}
          </button>
        )}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {initiatives.length}
        </span>
        {totalBudget > 0 && (
          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {new Intl.NumberFormat('ru-RU', {
              notation: 'compact',
              currency: 'RUB',
              style: 'currency',
              maximumFractionDigits: 1,
            }).format(totalBudget)}
          </span>
        )}
        {(stage.isWon || stage.isLost) && (
          <Badge
            variant={stage.isWon ? 'success' : 'destructive'}
            className="px-1.5 py-0 text-[10px]"
          >
            {stage.isWon ? 'Won' : 'Lost'}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground"
            >
              <MoreVerticalIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <PencilIcon className="size-3.5" />
              Переименовать
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Цвет колонки
            </DropdownMenuLabel>
            <div className="grid grid-cols-5 gap-1.5 px-2 py-1.5">
              {STAGE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => void changeColor(c)}
                  className="relative flex size-6 items-center justify-center rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  aria-label={`Цвет ${c}`}
                >
                  {stage.color === c && (
                    <CheckIcon className="size-3.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2Icon className="size-3.5" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <div
        ref={setCardsRef}
        className={cn(
          'flex min-h-[80px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 transition-colors',
          isOver && 'bg-accent/40',
        )}
      >
        <SortableContext
          items={initiatives.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {initiatives.map((initiative) => (
            <InitiativeCard key={initiative.id} initiative={initiative} />
          ))}
        </SortableContext>
      </div>

      {/* Add initiative */}
      <div className="px-2 pb-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Link
            to="/initiatives/new"
            search={{ stageId: stage.id } as Record<string, string>}
          >
            <PlusIcon className="mr-1 size-3.5" />
            Добавить
          </Link>
        </Button>
      </div>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить колонку «{stage.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Инициативы в этой колонке останутся, но потеряют привязку к
              этапу.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
