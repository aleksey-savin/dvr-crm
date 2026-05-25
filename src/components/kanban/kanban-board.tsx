import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'
import type {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
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

function sameIds(a: string[] | undefined, b: string[]): boolean {
  return !!a && a.length === b.length && a.every((id, i) => id === b[i])
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
  /** When set, enables persistent within-column ordering. Receives the target
   * stage and the full ordered list of item ids now in that stage. */
  onReorderItems?: (stageId: string, orderedIds: string[]) => Promise<void>
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
  /** When set, items with no/unknown stage are shown in a virtual leading column with this label. */
  unassignedLabel?: string
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
  onReorderItems,
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
  unassignedLabel,
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
  // Optimistic per-stage card order applied after a drop, until the server
  // (loader) catches up. Keyed by stage id → ordered item ids.
  const [orderOverrides, setOrderOverrides] = React.useState<
    Record<string, string[]>
  >({})

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

  const idToItem = new Map(items.map((i) => [getItemId(i), i]))

  // Group items by stage in the items-prop order (already position-sorted by
  // the loader), then apply any optimistic per-stage order override.
  const byStage = new Map<string, TItem[]>()
  for (const stage of orderedStages) byStage.set(stage.id, [])
  for (const item of items) {
    const sid = stageIdOf(item)
    if (sid && byStage.has(sid)) byStage.get(sid)!.push(item)
  }
  for (const [sid, ids] of Object.entries(orderOverrides)) {
    const list = byStage.get(sid)
    if (!list) continue
    const rank = new Map(ids.map((id, i) => [id, i]))
    list.sort(
      (a, b) =>
        (rank.get(getItemId(a)) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(getItemId(b)) ?? Number.MAX_SAFE_INTEGER),
    )
  }

  // Items whose stage is missing or points to a non-existent stage.
  const unassignedItems = unassignedLabel
    ? items.filter((i) => {
        const sid = stageIdOf(i)
        return !sid || !byStage.has(sid)
      })
    : []

  // Collision detection: a real (non-active) card directly under the pointer
  // wins → precise insert. Otherwise the column under the pointer wins → the
  // empty area below the cards means "drop at the end". (closest* strategies
  // mis-pick cards near boundaries, so we hit-test pointerWithin directly.)
  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args)
    const base = pointer.length > 0 ? pointer : rectIntersection(args)
    if (base.length === 0) return base
    const activeCardId = args.active.id

    const cardHit = base.find((c) => {
      const id = c.id as string
      return (
        id !== activeCardId &&
        !isColumnDragId(id) &&
        !byStage.has(id) &&
        idToItem.has(id)
      )
    })
    if (cardHit) return [cardHit]

    const columnHit = base.find(
      (c) => byStage.has(c.id as string) || isColumnDragId(c.id as string),
    )
    return columnHit ? [columnHit] : base
  }

  const activeItem =
    activeId && !isColumnDragId(activeId)
      ? items.find((i) => getItemId(i) === activeId)
      : null

  // Real (pre-drag) stage of the card being dragged — used to decide whether a
  // server move is needed on drop (overrides change the displayed stage live).
  const dragOriginStage = React.useRef<string | null>(null)

  // Resolve which stage an `over.id` points to (a column droppable id, a
  // `col-<id>` sortable id, or a card id inside a column).
  const resolveTargetStage = (overIdStr: string): TStage | undefined => {
    const normalizedOverId = isColumnDragId(overIdStr)
      ? stripColumnPrefix(overIdStr)
      : overIdStr
    return (
      orderedStages.find((s) => s.id === normalizedOverId) ??
      orderedStages.find((s) =>
        byStage.get(s.id)?.some((i) => getItemId(i) === normalizedOverId),
      )
    )
  }

  const clearOverride = (itemId: string) =>
    setStageOverrides((prev) => {
      if (!(itemId in prev)) return prev
      const next = { ...prev }
      delete next[itemId]
      return next
    })

  // The final ordered ids of `targetStageId` after the drop, computed exactly
  // like dnd-kit renders it: arrayMove(items, activeIndex, overIndex) on the
  // SortableContext list (which already contains the active card). This makes
  // the committed order identical to the live preview — no boundary off-by-one
  // and no preview/result mismatch. When `overId` is the column (pointer in the
  // empty area below the cards) the card goes to the end.
  const computeStageOrder = (
    targetStageId: string,
    overId: string,
    itemId: string,
  ): string[] => {
    const ids = (byStage.get(targetStageId) ?? []).map((i) => getItemId(i))
    if (!ids.includes(itemId)) ids.push(itemId)
    const activeIndex = ids.indexOf(itemId)
    const overIsCard =
      !isColumnDragId(overId) &&
      overId !== targetStageId &&
      overId !== itemId &&
      ids.includes(overId)
    const overIndex = overIsCard ? ids.indexOf(overId) : ids.length - 1
    return activeIndex === overIndex
      ? ids
      : arrayMove(ids, activeIndex, overIndex)
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    setActiveId(id)
    if (!isColumnDragId(id)) {
      const item = idToItem.get(id)
      dragOriginStage.current = item ? getItemStageId(item) : null
    }
  }

  // Cross-column: live-move the card into the hovered column AND place it at the
  // hovered index (so the preview matches the eventual drop). Within the origin
  // column we don't touch state here — dnd-kit's own sortable animation shows
  // the gap and we commit on drop (mutating order here would oscillate).
  // Intercepted stages (won/lost) react only on drop.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeIdStr = active.id as string
    if (isColumnDragId(activeIdStr)) return

    const targetStage = resolveTargetStage(over.id as string)
    if (!targetStage) return

    const item = idToItem.get(activeIdStr)
    if (!item) return
    if (interceptDrop?.(item, targetStage)) return

    const sameStage = dragOriginStage.current === targetStage.id
    if (sameStage) {
      // Back in (or never left) the origin column — drop any cross-column
      // override so the card returns, and let dnd-kit handle the gap.
      if (activeIdStr in stageOverrides) clearOverride(activeIdStr)
      setOrderOverrides((prev) => (Object.keys(prev).length ? {} : prev))
      return
    }

    setStageOverrides((prev) =>
      prev[activeIdStr] === targetStage.id
        ? prev
        : { ...prev, [activeIdStr]: targetStage.id },
    )

    if (!onReorderItems) return
    // Place the foreign card at the END of the target column — a stable anchor
    // (set once, no per-move state churn). dnd-kit's sortable strategy then
    // animates the gap as the pointer moves over cards, and the precise index
    // is committed on drop with the same arrayMove dnd-kit used for the preview.
    const appended = [
      ...(byStage.get(targetStage.id) ?? [])
        .map((i) => getItemId(i))
        .filter((id) => id !== activeIdStr),
      activeIdStr,
    ]
    setOrderOverrides((prev) =>
      sameIds(prev[targetStage.id], appended)
        ? prev
        : { [targetStage.id]: appended },
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    const activeIdStr = active.id as string
    const origin = dragOriginStage.current
    dragOriginStage.current = null

    if (!over) {
      if (!isColumnDragId(activeIdStr)) {
        clearOverride(activeIdStr)
        setOrderOverrides({})
      }
      return
    }

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
    const item = idToItem.get(itemId)
    if (!item) {
      setOrderOverrides({})
      return
    }

    const targetStage = resolveTargetStage(overIdStr)
    if (!targetStage) {
      clearOverride(itemId)
      setOrderOverrides({})
      return
    }

    if (interceptDrop?.(item, targetStage)) {
      clearOverride(itemId)
      setOrderOverrides({})
      onInterceptedDrop?.(item, targetStage)
      return
    }

    // Without persistent ordering: only commit a stage change.
    if (!onReorderItems) {
      if (targetStage.id === origin) {
        clearOverride(itemId)
        return
      }
      void handleMove(itemId, targetStage.id)
      return
    }

    // Persistent ordering: commit exactly what the live preview showed.
    const sameStage = origin === targetStage.id
    const current = (byStage.get(targetStage.id) ?? []).map((i) => getItemId(i))
    const stageIds = computeStageOrder(targetStage.id, overIdStr, itemId)

    if (sameStage && sameIds(current, stageIds)) {
      clearOverride(itemId)
      return
    }

    setOrderOverrides({ [targetStage.id]: stageIds })
    applyOptimisticMove(itemId, targetStage.id)
    void (async () => {
      try {
        if (!sameStage) await onMoveItem(itemId, targetStage.id)
        await onReorderItems(targetStage.id, stageIds)
        setOrderOverrides({})
      } catch {
        setOrderOverrides({})
        clearOverride(itemId)
      }
    })()
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
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-[60vh] items-stretch gap-3 overflow-x-auto pb-4">
        {unassignedLabel && unassignedItems.length > 0 && (
          <div className="flex w-72 shrink-0 flex-col rounded-xl border border-dashed bg-muted/30">
            <div className="flex items-center gap-1.5 px-2 py-2">
              <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground/40" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                {unassignedLabel}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {unassignedItems.length}
              </span>
            </div>
            <div className="flex min-h-[80px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              <SortableContext
                items={unassignedItems.map((i) => getItemId(i))}
                strategy={verticalListSortingStrategy}
              >
                {unassignedItems.map((item) => (
                  <React.Fragment key={getItemId(item)}>
                    {renderCard(item, {})}
                  </React.Fragment>
                ))}
              </SortableContext>
            </div>
          </div>
        )}

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
