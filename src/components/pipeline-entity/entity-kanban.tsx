import * as React from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { EntityCard } from './entity-card'
import { EntitySheet } from './entity-sheet'
import {
  addStage,
  deleteStage,
  reorderEntities,
  reorderStages,
  updateStage,
} from './stage-actions'
import type { EntityConfig, EntityRowBase, RefusalReason } from './types'
import type { EntityStageOption, PipelineWithStages } from '@/types'

type EntityKanbanProps<TRow extends EntityRowBase, TFull> = {
  config: EntityConfig<TRow, TFull>
  rows: TRow[]
  stages: EntityStageOption[]
  pipelines: PipelineWithStages[]
  refusalReasons: RefusalReason[]
  onMutated: () => Promise<void> | void
}

export function EntityKanban<TRow extends EntityRowBase, TFull>({
  config,
  rows,
  stages,
  pipelines,
  refusalReasons,
  onMutated,
}: EntityKanbanProps<TRow, TFull>) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<TRow | null>(null)

  // Keep the open sheet in sync with refreshed data.
  const open = (selected && rows.find((r) => r.id === selected.id)) || selected

  const firstStageId = stages[0]?.id

  return (
    <>
      <KanbanBoard<TRow, EntityStageOption>
        stages={stages}
        items={rows}
        getItemId={(r) => r.id}
        getItemStageId={(r) => r.stageId}
        renderCard={(r, { isDragOverlay }) => (
          <EntityCard
            config={config}
            row={r}
            pipelines={pipelines}
            refusalReasons={refusalReasons}
            onOpen={setSelected}
            onDone={() => void onMutated()}
            isDragOverlay={isDragOverlay}
          />
        )}
        onMoveItem={async (id, stageId) => {
          try {
            await config.move(id, stageId)
            await onMutated()
          } catch (error) {
            toast.error(`Не удалось переместить ${config.words.acc}`)
            throw error
          }
        }}
        onReorderItems={async (_stageId, orderedIds) => {
          try {
            await reorderEntities({
              data: { entityType: config.type, orderedIds },
            })
            await onMutated()
          } catch (error) {
            toast.error('Не удалось сохранить порядок')
            throw error
          }
        }}
        onReorderStages={async (stageIds) => {
          try {
            await reorderStages({ data: { stageIds } })
            await router.invalidate()
          } catch (error) {
            toast.error('Не удалось переупорядочить колонки')
            throw error
          }
        }}
        onRenameStage={async (id, name) => {
          await updateStage({ data: { id, name } })
          await router.invalidate()
        }}
        onRecolorStage={async (id, color) => {
          await updateStage({ data: { id, color } })
          await router.invalidate()
        }}
        onDeleteStage={async (id, reassignToStageId) => {
          await deleteStage({
            data: { entityType: config.type, id, reassignToStageId },
          })
          await router.invalidate()
        }}
        onAddStage={async (name) => {
          await addStage({ data: { entityType: config.type, name } })
          await router.invalidate()
        }}
        deleteStageDescription={`${config.words.plural} в этой колонке останутся, но потеряют привязку к этапу.`}
        unassignedLabel="Не задан этап"
        renderColumnFooter={(stage) =>
          stage.id === firstStageId ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Link to={config.newRoute}>
                <PlusIcon className="mr-1 size-3.5" />
                Добавить {config.words.acc}
              </Link>
            </Button>
          ) : null
        }
      />

      <EntitySheet
        config={config}
        row={open}
        pipelines={pipelines}
        refusalReasons={refusalReasons}
        onOpenChange={(o) => {
          if (!o) setSelected(null)
        }}
        onDone={() => void onMutated()}
      />
    </>
  )
}
