import * as React from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { LeadCard } from './lead-card'
import { LeadSheet } from './lead-sheet'
import {
  addLeadStage,
  deleteLeadStage,
  moveLeadStage,
  reorderLeadStages,
  updateLeadStage,
} from './actions'
import type { LeadRow, LeadStageOption, PipelineWithStages } from '@/types'

type LeadKanbanProps = {
  leads: LeadRow[]
  stages: LeadStageOption[]
  pipelines: PipelineWithStages[]
  refusalReasons: Array<{ id: string; name: string }>
  onMutated: () => Promise<void> | void
}

export function LeadKanban({
  leads,
  stages,
  pipelines,
  refusalReasons,
  onMutated,
}: LeadKanbanProps) {
  const router = useRouter()
  const [selectedLead, setSelectedLead] = React.useState<LeadRow | null>(null)

  // Keep the open sheet in sync with refreshed data.
  const selected =
    (selectedLead && leads.find((l) => l.id === selectedLead.id)) ||
    selectedLead

  const firstStageId = stages[0]?.id

  return (
    <>
      <KanbanBoard<LeadRow, LeadStageOption>
        stages={stages}
        items={leads}
        getItemId={(l) => l.id}
        getItemStageId={(l) => l.stageId}
        renderCard={(l, { isDragOverlay }) => (
          <LeadCard
            lead={l}
            pipelines={pipelines}
            refusalReasons={refusalReasons}
            onOpen={setSelectedLead}
            onDone={() => void onMutated()}
            isDragOverlay={isDragOverlay}
          />
        )}
        onMoveItem={async (id, stageId) => {
          try {
            await moveLeadStage({ data: { id, stageId } })
            await onMutated()
          } catch (error) {
            toast.error('Не удалось переместить лид')
            throw error
          }
        }}
        onReorderStages={async (stageIds) => {
          try {
            await reorderLeadStages({ data: { stageIds } })
            await router.invalidate()
          } catch (error) {
            toast.error('Не удалось переупорядочить колонки')
            throw error
          }
        }}
        onRenameStage={async (id, name) => {
          await updateLeadStage({ data: { id, name } })
          await router.invalidate()
        }}
        onRecolorStage={async (id, color) => {
          await updateLeadStage({ data: { id, color } })
          await router.invalidate()
        }}
        onDeleteStage={async (id, reassignToStageId) => {
          await deleteLeadStage({ data: { id, reassignToStageId } })
          await router.invalidate()
        }}
        onAddStage={async (name) => {
          await addLeadStage({ data: { name } })
          await router.invalidate()
        }}
        deleteStageDescription="Лиды в этой колонке останутся, но потеряют привязку к этапу."
        renderColumnFooter={(stage) =>
          stage.id === firstStageId ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Link to="/leads/new">
                <PlusIcon className="mr-1 size-3.5" />
                Добавить лид
              </Link>
            </Button>
          ) : null
        }
      />

      <LeadSheet
        lead={selected}
        pipelines={pipelines}
        refusalReasons={refusalReasons}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null)
        }}
        onDone={() => void onMutated()}
      />
    </>
  )
}
