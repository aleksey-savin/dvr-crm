import * as React from 'react'
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
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { COLUMN_ID_PREFIX, STAGE_COLORS } from './kanban-board'
import type { KanbanStage } from './kanban-board'

type KanbanColumnProps<TStage extends KanbanStage> = {
  stage: TStage
  count: number
  itemIds: string[]
  otherStages: TStage[]
  onRename: (id: string, name: string) => Promise<void> | void
  onRecolor: (id: string, color: string) => Promise<void> | void
  onDelete: (
    id: string,
    reassignToStageId: string | null,
  ) => Promise<void> | void
  deleteDescription?: string
  headerExtra?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}

export function KanbanColumn<TStage extends KanbanStage>({
  stage,
  count,
  itemIds,
  otherStages,
  onRename,
  onRecolor,
  onDelete,
  deleteDescription = 'Карточки в этой колонке останутся, но потеряют привязку к этапу.',
  headerExtra,
  footer,
  children,
}: KanbanColumnProps<TStage>) {
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState(stage.name)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [reassignTo, setReassignTo] = React.useState<string>('')

  // When the column holds cards, deletion must move them to another column.
  const needsReassign = count > 0 && otherStages.length > 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${COLUMN_ID_PREFIX}${stage.id}` })

  const { setNodeRef: setCardsRef, isOver } = useDroppable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const commitRename = async () => {
    const trimmed = nameDraft.trim()
    setIsRenaming(false)
    if (!trimmed || trimmed === stage.name) {
      setNameDraft(stage.name)
      return
    }
    try {
      await onRename(stage.id, trimmed)
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
      await onRecolor(stage.id, color)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось обновить цвет',
      )
    }
  }

  const handleDelete = async () => {
    if (needsReassign && !reassignTo) {
      toast.error('Выберите этап для переноса карточек')
      return
    }
    try {
      await onDelete(stage.id, needsReassign ? reassignTo : null)
      toast.success('Колонка удалена')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить')
    } finally {
      setConfirmDelete(false)
      setReassignTo('')
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
          {count}
        </span>
        {headerExtra}
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
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>

      {footer && <div className="px-2 pb-2">{footer}</div>}

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete(false)
            setReassignTo('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить колонку «{stage.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              {needsReassign
                ? `В колонке ${count} ${count === 1 ? 'карточка' : 'карточек'}. Выберите этап, на который их перенести.`
                : deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {needsReassign && (
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger>
                <SelectValue placeholder="Перенести карточки на этап" />
              </SelectTrigger>
              <SelectContent>
                {otherStages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={needsReassign && !reassignTo}
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
