import * as React from 'react'
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
import { KanbanColumn } from './kanban-column'
import { KanbanAddColumn } from './kanban-add-column'

export const COLUMN_ID_PREFIX = 'col-'

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

export type KanbanStage = {
  id: string
  name: string
  color: string
  order: number
}

export type KanbanBoardHandle = {
  applyOptimisticMove: (itemId: string, stageId: string) => void
}

function isColumnDragId(id: string): boolean {
  return id.startsWith(COLUMN_ID_PREFIX)
}
function stripColumnPrefix(id: string): string {
  return id.slice(COLUMN_ID_PREFIX.length)
}

type KanbanBoardProps<TItem, TStage extends KanbanStage> = {
  stages: TStage[]
  items: TItem[]
  getItemId: (item: TItem) => string
  getItemStageId: (item: TItem) => string | null
  renderCard: (
    item: TItem,
    opts: { isDragOverlay?: boolean },
  ) => React.ReactNode
  onMoveItem: (itemId: string, stageId: string) => Promise<void>
  onReorderStages: (stageIds: string[]) => Promise<void>
  onRenameStage: (id: string, name: string) => Promise<void> | void
  onRecolorStage: (id: string, color: string) => Promise<void> | void
  onDeleteStage: (
    id: string,
    reassignToStageId: string | null,
  ) => Promise<void> | void
  onAddStage: (name: string) => Promise<void> | void
  /** Return true to suppress the default move and let onInterceptedDrop handle it (e.g. open a dialog). */
  interceptDrop?: (item: TItem, targetStage: TStage) => boolean
  onInterceptedDrop?: (item: TItem, targetStage: TStage) => void
  renderColumnHeaderExtra?: (stage: TStage, items: TItem[]) => React.ReactNode
  renderColumnFooter?: (stage: TStage) => React.ReactNode
  addColumnLabel?: string
  deleteStageDescription?: string
  /** Imperative handle for optimistic moves committed by the parent (after a dialog). */
  actionRef?: React.MutableRefObject<KanbanBoardHandle | null>
}

export function KanbanBoard<TItem, TStage extends KanbanStage>({
  stages,
  items,
  getItemId,
  getItemStageId,
  renderCard,
  onMoveItem,
  onReorderStages,
  onRenameStage,
  onRecolorStage,
  onDeleteStage,
  onAddStage,
  interceptDrop,
  onInterceptedDrop,
  renderColumnHeaderExtra,
  renderColumnFooter,
  addColumnLabel,
  deleteStageDescription,
  actionRef,
}: KanbanBoardProps<TItem, TStage>) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
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

  const applyOptimisticMove = React.useCallback(
    (itemId: string, stageId: string) => {
      setStageOverrides((prev) => ({ ...prev, [itemId]: stageId }))
    },
    [],
  )

  React.useImperativeHandle(actionRef, () => ({ applyOptimisticMove }), [
    applyOptimisticMove,
  ])

  const stageIdOf = (item: TItem): string | null =>
    stageOverrides[getItemId(item)] ?? getItemStageId(item)

  // Drop optimistic overrides the server has caught up with.
  const staleOverrideIds = Object.keys(stageOverrides).filter((id) => {
    const real = items.find((i) => getItemId(i) === id)
    return real && getItemStageId(real) === stageOverrides[id]
  })
  React.useEffect(() => {
    if (staleOverrideIds.length === 0) return
    setStageOverrides((prev) => {
      const next = { ...prev }
      for (const id of staleOverrideIds) delete next[id]
      return next
    })
  }, [staleOverrideIds.join(',')])

  // Apply optimistic column order.
  const orderedStages = React.useMemo(() => {
    if (!stageOrderOverride) return stages
    const byId = new Map(stages.map((s) => [s.id, s]))
    const result: TStage[] = []
    for (const id of stageOrderOverride) {
      const s = byId.get(id)
      if (s) result.push(s)
    }
    for (const s of stages) {
      if (!stageOrderOverride.includes(s.id)) result.push(s)
    }
    return result
  }, [stages, stageOrderOverride])

  const serverOrderMatchesOverride =
    stageOrderOverride &&
    stageOrderOverride.length === stages.length &&
    stages.every((s, idx) => stageOrderOverride[idx] === s.id)
  React.useEffect(() => {
    if (serverOrderMatchesOverride) setStageOrderOverride(null)
  }, [serverOrderMatchesOverride])

  // Group items by stage.
  const byStage = new Map<string, TItem[]>()
  for (const stage of orderedStages) byStage.set(stage.id, [])
  for (const item of items) {
    const sid = stageIdOf(item)
    if (sid && byStage.has(sid)) byStage.get(sid)!.push(item)
  }

  const activeItem =
    activeId && !isColumnDragId(activeId)
      ? items.find((i) => getItemId(i) === activeId)
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

    // Card move
    const itemId = activeIdStr
    const normalizedOverId = isColumnDragId(overIdStr)
      ? stripColumnPrefix(overIdStr)
      : overIdStr
    const targetStage =
      orderedStages.find((s) => s.id === normalizedOverId) ??
      orderedStages.find((s) =>
        byStage.get(s.id)?.some((i) => getItemId(i) === normalizedOverId),
      )
    if (!targetStage) return

    const item = items.find((i) => getItemId(i) === itemId)
    if (!item || stageIdOf(item) === targetStage.id) return

    if (interceptDrop?.(item, targetStage)) {
      onInterceptedDrop?.(item, targetStage)
      return
    }

    void handleMove(itemId, targetStage.id)
  }

  async function handleReorderColumns(stageIds: string[]) {
    try {
      await onReorderStages(stageIds)
    } catch {
      setStageOrderOverride(null)
    }
  }

  async function handleMove(itemId: string, stageId: string) {
    applyOptimisticMove(itemId, stageId)
    try {
      await onMoveItem(itemId, stageId)
    } catch {
      setStageOverrides((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
    }
  }

  const columnIds = orderedStages.map((s) => `${COLUMN_ID_PREFIX}${s.id}`)

  return (
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
          {orderedStages.map((stage) => {
            const stageItems = byStage.get(stage.id) ?? []
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                count={stageItems.length}
                itemIds={stageItems.map((i) => getItemId(i))}
                otherStages={orderedStages.filter((s) => s.id !== stage.id)}
                onRename={onRenameStage}
                onRecolor={onRecolorStage}
                onDelete={onDeleteStage}
                deleteDescription={deleteStageDescription}
                headerExtra={renderColumnHeaderExtra?.(stage, stageItems)}
                footer={renderColumnFooter?.(stage)}
              >
                {stageItems.map((item) => (
                  <React.Fragment key={getItemId(item)}>
                    {renderCard(item, {})}
                  </React.Fragment>
                ))}
              </KanbanColumn>
            )
          })}
        </SortableContext>

        <KanbanAddColumn onAdd={onAddStage} label={addColumnLabel} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? renderCard(activeItem, { isDragOverlay: true }) : null}
      </DragOverlay>
    </DndContext>
  )
}
