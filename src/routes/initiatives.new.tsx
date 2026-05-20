import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { InitiativeForm } from '@/components/initiatives/initiative-form'
import { fetchInitiativeFormOptions } from '@/components/initiatives/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/initiatives/new')({
  loader: () => fetchInitiativeFormOptions(),
  component: RouteComponent,
})

function RouteComponent() {
  const options = Route.useLoaderData()
  const navigate = useNavigate()
  // Optional: pre-select pipeline/stage from kanban "+ Добавить" button
  const search = useSearch({ strict: false })
  const preStageId = search.stageId ?? null
  // Derive pipeline that contains this stage so the form is fully wired.
  const prePipelineId = preStageId
    ? (options.pipelines.find((p) => p.stages.some((s) => s.id === preStageId))
        ?.id ?? null)
    : null

  const handleClose = () => navigate({ to: '/initiatives' })
  // Stay on the kanban after create — no redirect to detail view.
  const handleSuccess = () => handleClose()

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новая инициатива"
      description="Создание инициативы в воронке продаж"
      contentClassName="sm:max-w-2xl"
    >
      <InitiativeForm
        options={options}
        prefill={{
          pipelineId: prePipelineId,
          stageId: preStageId,
          sourceType: 'manual',
        }}
        hidePipelineStage={Boolean(preStageId)}
        onSuccess={handleSuccess}
      />
    </ResponsiveDialog>
  )
}
