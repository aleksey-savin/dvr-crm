import * as React from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import type { KanbanBoardHandle } from '@/components/kanban/kanban-board'
import {
  addPipelineStage,
  deletePipelineStage,
  reorderPipelineStages,
  updatePipelineStage,
} from '@/components/pipelines/actions'
import { InitiativeCard } from './initiative-card'
import {
  moveInitiativeStage,
  reorderInitiatives,
  closeInitiativeWon,
  closeInitiativeLost,
} from './actions'
import type {
  InitiativeRow,
  PipelineStageOption,
  PipelineWithStages,
} from '@/types'

// ---------------------------------------------------------------------------
// Close-won dialog
// ---------------------------------------------------------------------------

type CloseWonDialogProps = {
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function CloseWonDialog({ open, onConfirm, onCancel }: CloseWonDialogProps) {
  const [loading, setLoading] = React.useState(false)
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Закрыть как выигранную?</AlertDialogTitle>
          <AlertDialogDescription>
            Инициатива будет отмечена как успешно закрытая.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={onCancel}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={async (e) => {
              e.preventDefault()
              setLoading(true)
              await onConfirm()
              setLoading(false)
            }}
          >
            {loading ? 'Сохранение...' : 'Подтвердить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Close-lost dialog
// ---------------------------------------------------------------------------

type CloseLostDialogProps = {
  open: boolean
  refusalReasons: Array<{ id: string; name: string }>
  onConfirm: (refusalReasonId: string | null) => Promise<void>
  onCancel: () => void
}

function CloseLostDialog({
  open,
  refusalReasons,
  onConfirm,
  onCancel,
}: CloseLostDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [reasonId, setReasonId] = React.useState<string>('')

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Закрыть как проигранную?</AlertDialogTitle>
          <AlertDialogDescription>
            Укажите причину потери, если она известна.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Select value={reasonId} onValueChange={setReasonId}>
          <SelectTrigger>
            <SelectValue placeholder="Причина отказа (необязательно)" />
          </SelectTrigger>
          <SelectContent>
            {refusalReasons.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={onCancel}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={loading}
            onClick={async (e) => {
              e.preventDefault()
              setLoading(true)
              await onConfirm(reasonId || null)
              setLoading(false)
            }}
          >
            {loading ? 'Сохранение...' : 'Закрыть'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Initiative kanban board — thin wrapper over the generic KanbanBoard
// ---------------------------------------------------------------------------

type KanbanBoardProps = {
  pipeline: PipelineWithStages
  initiatives: InitiativeRow[]
  refusalReasons: Array<{ id: string; name: string }>
}

type PendingDrop = {
  initiativeId: string
  targetStageId: string
  isWon: boolean
  isLost: boolean
}

export function InitiativeKanbanBoard({
  pipeline,
  initiatives,
  refusalReasons,
}: KanbanBoardProps) {
  const router = useRouter()
  const boardRef = React.useRef<KanbanBoardHandle | null>(null)
  const [pendingDrop, setPendingDrop] = React.useState<PendingDrop | null>(null)

  async function handleConfirmWon() {
    if (!pendingDrop) return
    boardRef.current?.applyOptimisticMove(
      pendingDrop.initiativeId,
      pendingDrop.targetStageId,
    )
    try {
      await closeInitiativeWon({
        data: {
          id: pendingDrop.initiativeId,
          stageId: pendingDrop.targetStageId,
        },
      })
      toast.success('Инициатива закрыта как выигранная')
      await router.invalidate()
    } catch {
      toast.error('Не удалось закрыть инициативу')
    } finally {
      setPendingDrop(null)
    }
  }

  async function handleConfirmLost(refusalReasonId: string | null) {
    if (!pendingDrop) return
    boardRef.current?.applyOptimisticMove(
      pendingDrop.initiativeId,
      pendingDrop.targetStageId,
    )
    try {
      await closeInitiativeLost({
        data: {
          id: pendingDrop.initiativeId,
          stageId: pendingDrop.targetStageId,
          refusalReasonId,
        },
      })
      toast.success('Инициатива закрыта как проигранная')
      await router.invalidate()
    } catch {
      toast.error('Не удалось закрыть инициативу')
    } finally {
      setPendingDrop(null)
    }
  }

  return (
    <>
      <KanbanBoard<InitiativeRow, PipelineStageOption>
        actionRef={boardRef}
        stages={pipeline.stages}
        items={initiatives}
        getItemId={(i) => i.id}
        getItemStageId={(i) => i.stageId}
        renderCard={(i, { isDragOverlay }) => (
          <InitiativeCard initiative={i} isDragOverlay={isDragOverlay} />
        )}
        interceptDrop={(_i, stage) => stage.isWon || stage.isLost}
        onInterceptedDrop={(i, stage) =>
          setPendingDrop({
            initiativeId: i.id,
            targetStageId: stage.id,
            isWon: stage.isWon,
            isLost: stage.isLost,
          })
        }
        onMoveItem={async (id, stageId) => {
          try {
            await moveInitiativeStage({ data: { id, stageId } })
            await router.invalidate()
          } catch (error) {
            toast.error('Не удалось переместить инициативу')
            throw error
          }
        }}
        onReorderItems={async (_stageId, orderedIds) => {
          try {
            await reorderInitiatives({ data: { orderedIds } })
            await router.invalidate()
          } catch (error) {
            toast.error('Не удалось сохранить порядок')
            throw error
          }
        }}
        onReorderStages={async (stageIds) => {
          try {
            await reorderPipelineStages({
              data: { pipelineId: pipeline.id, stageIds },
            })
            await router.invalidate()
          } catch (error) {
            toast.error('Не удалось переупорядочить колонки')
            throw error
          }
        }}
        onRenameStage={async (id, name) => {
          await updatePipelineStage({ data: { id, name } })
          await router.invalidate()
        }}
        onRecolorStage={async (id, color) => {
          await updatePipelineStage({ data: { id, color } })
          await router.invalidate()
        }}
        onDeleteStage={async (id, reassignToStageId) => {
          await deletePipelineStage({ data: { id, reassignToStageId } })
          await router.invalidate()
        }}
        onAddStage={async (name) => {
          await addPipelineStage({ data: { pipelineId: pipeline.id, name } })
          await router.invalidate()
        }}
        deleteStageDescription="Инициативы в этой колонке останутся, но потеряют привязку к этапу."
        renderColumnHeaderExtra={(stage, stageItems) => {
          const totalBudget = stageItems.reduce(
            (sum, i) => sum + (i.budget ? Number(i.budget) : 0),
            0,
          )
          return (
            <>
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
            </>
          )
        }}
        renderColumnFooter={(stage) => (
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
        )}
      />

      <CloseWonDialog
        open={pendingDrop?.isWon === true}
        onConfirm={handleConfirmWon}
        onCancel={() => setPendingDrop(null)}
      />

      <CloseLostDialog
        open={pendingDrop?.isLost === true}
        refusalReasons={refusalReasons}
        onConfirm={handleConfirmLost}
        onCancel={() => setPendingDrop(null)}
      />
    </>
  )
}

export { InitiativeKanbanBoard as KanbanBoard }
