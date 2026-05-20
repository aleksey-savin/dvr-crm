import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InitiativeCard } from './initiative-card'
import { KanbanColumn } from './kanban-column'
import { KanbanAddColumn } from './kanban-add-column'
import {
  moveInitiativeStage,
  closeInitiativeWon,
  closeInitiativeLost,
} from './actions'
import { reorderPipelineStages } from '@/components/pipelines/actions'
import type { InitiativeRow, PipelineWithStages } from '@/types'

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
// Main kanban board
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

const COLUMN_ID_PREFIX = 'col-'

function isColumnDragId(id: string): boolean {
  return id.startsWith(COLUMN_ID_PREFIX)
}
function stripColumnPrefix(id: string): string {
  return id.slice(COLUMN_ID_PREFIX.length)
}

export function KanbanBoard({
  pipeline,
  initiatives,
  refusalReasons,
}: KanbanBoardProps) {
  const router = useRouter()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [pendingDrop, setPendingDrop] = React.useState<PendingDrop | null>(null)
  // Optimistic stage overrides for in-flight card moves so the UI reflects the
  // change instantly without waiting for the server round trip.
  const [stageOverrides, setStageOverrides] = React.useState<
    Record<string, string>
  >({})
  // Optimistic stage order — set when the user drops a column reorder; cleared
  // once the loader catches up.
  const [stageOrderOverride, setStageOrderOverride] = React.useState<
    string[] | null
  >(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Apply optimistic card overrides and drop entries the server has caught up with.
  const displayInitiatives = initiatives.map((i) =>
    stageOverrides[i.id] ? { ...i, stageId: stageOverrides[i.id] } : i,
  )
  const staleOverrideIds = Object.keys(stageOverrides).filter((id) => {
    const real = initiatives.find((i) => i.id === id)
    return real && real.stageId === stageOverrides[id]
  })
  React.useEffect(() => {
    if (staleOverrideIds.length === 0) return
    setStageOverrides((prev) => {
      const next = { ...prev }
      for (const id of staleOverrideIds) delete next[id]
      return next
    })
  }, [staleOverrideIds.join(',')])

  // Apply optimistic column order: reorder pipeline.stages locally so the UI
  // updates instantly. Clear the override once the loader data matches.
  const orderedStages = React.useMemo(() => {
    if (!stageOrderOverride) return pipeline.stages
    const byId = new Map(pipeline.stages.map((s) => [s.id, s]))
    const result: typeof pipeline.stages = []
    for (const id of stageOrderOverride) {
      const s = byId.get(id)
      if (s) result.push(s)
    }
    // Append any stages not in the override (newly added since drop).
    for (const s of pipeline.stages) {
      if (!stageOrderOverride.includes(s.id)) result.push(s)
    }
    return result
  }, [pipeline.stages, stageOrderOverride])

  const serverOrderMatchesOverride =
    stageOrderOverride &&
    stageOrderOverride.length === pipeline.stages.length &&
    pipeline.stages.every((s, idx) => stageOrderOverride[idx] === s.id)
  React.useEffect(() => {
    if (serverOrderMatchesOverride) setStageOrderOverride(null)
  }, [serverOrderMatchesOverride])

  // Group initiatives by stage
  const byStage = new Map<string, InitiativeRow[]>()
  for (const stage of orderedStages) byStage.set(stage.id, [])
  for (const initiative of displayInitiatives) {
    if (initiative.stageId && byStage.has(initiative.stageId)) {
      byStage.get(initiative.stageId)!.push(initiative)
    }
  }

  const activeInitiative =
    activeId && !isColumnDragId(activeId)
      ? displayInitiatives.find((i) => i.id === activeId)
      : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    // Column reorder
    if (isColumnDragId(activeIdStr)) {
      if (!isColumnDragId(overIdStr) || activeIdStr === overIdStr) return
      const fromId = stripColumnPrefix(activeIdStr)
      const toId = stripColumnPrefix(overIdStr)
      const oldIdx = orderedStages.findIndex((s) => s.id === fromId)
      const newIdx = orderedStages.findIndex((s) => s.id === toId)
      if (oldIdx < 0 || newIdx < 0) return
      const newOrder = arrayMove(orderedStages, oldIdx, newIdx).map((s) => s.id)
      setStageOrderOverride(newOrder)
      void handleReorderColumns(newOrder)
      return
    }

    // Card move — find the target stage from over.id. Over.id may be:
    //   - a stage id (column cards-area droppable)
    //   - another card's id (sortable card in some column)
    //   - a column-sortable id "col-<stageId>" (when dropped on column header)
    const initiativeId = activeIdStr
    const normalizedOverId = isColumnDragId(overIdStr)
      ? stripColumnPrefix(overIdStr)
      : overIdStr
    const targetStage =
      orderedStages.find((s) => s.id === normalizedOverId) ??
      orderedStages.find((s) =>
        byStage.get(s.id)?.some((i) => i.id === normalizedOverId),
      )
    if (!targetStage) return

    const initiative = displayInitiatives.find((i) => i.id === initiativeId)
    if (!initiative || initiative.stageId === targetStage.id) return

    if (targetStage.isWon || targetStage.isLost) {
      setPendingDrop({
        initiativeId,
        targetStageId: targetStage.id,
        isWon: targetStage.isWon,
        isLost: targetStage.isLost,
      })
      return
    }

    void handleMove(initiativeId, targetStage.id)
  }

  async function handleReorderColumns(stageIds: string[]) {
    try {
      await reorderPipelineStages({
        data: { pipelineId: pipeline.id, stageIds },
      })
      await router.invalidate()
    } catch {
      toast.error('Не удалось переупорядочить колонки')
      setStageOrderOverride(null)
    }
  }

  async function handleMove(initiativeId: string, stageId: string) {
    setStageOverrides((prev) => ({ ...prev, [initiativeId]: stageId }))
    try {
      await moveInitiativeStage({ data: { id: initiativeId, stageId } })
      await router.invalidate()
    } catch {
      toast.error('Не удалось переместить инициативу')
      setStageOverrides((prev) => {
        const next = { ...prev }
        delete next[initiativeId]
        return next
      })
    }
  }

  async function handleConfirmWon() {
    if (!pendingDrop) return
    setStageOverrides((prev) => ({
      ...prev,
      [pendingDrop.initiativeId]: pendingDrop.targetStageId,
    }))
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
      setStageOverrides((prev) => {
        const next = { ...prev }
        delete next[pendingDrop.initiativeId]
        return next
      })
    } finally {
      setPendingDrop(null)
    }
  }

  async function handleConfirmLost(refusalReasonId: string | null) {
    if (!pendingDrop) return
    setStageOverrides((prev) => ({
      ...prev,
      [pendingDrop.initiativeId]: pendingDrop.targetStageId,
    }))
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
      setStageOverrides((prev) => {
        const next = { ...prev }
        delete next[pendingDrop.initiativeId]
        return next
      })
    } finally {
      setPendingDrop(null)
    }
  }

  const columnIds = orderedStages.map((s) => `${COLUMN_ID_PREFIX}${s.id}`)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {orderedStages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                initiatives={byStage.get(stage.id) ?? []}
              />
            ))}
          </SortableContext>

          <KanbanAddColumn pipelineId={pipeline.id} />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeInitiative ? (
            <InitiativeCard initiative={activeInitiative} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

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
