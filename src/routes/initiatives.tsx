import * as React from 'react'
import { createFileRoute, Outlet, useRouter, useSearch } from '@tanstack/react-router'
import * as z from 'zod'
import {
  CalendarPlusIcon,
  FileTextIcon,
  GitMergeIcon,
  KanbanIcon,
  LayoutListIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { ProposalForm } from '@/components/proposals/proposal-form'
import {
  fetchInitiatives,
  fetchInitiativeFormOptions,
} from '@/components/initiatives/actions'
import { fetchPipelines } from '@/components/pipelines/actions'
import { KanbanBoard } from '@/components/initiatives/kanban-board'
import { PipelineTabs } from '@/components/pipelines/pipeline-tabs'
import { PipelineFormDialog } from '@/components/pipelines/pipeline-form-dialog'
import { PipelineDeleteDialog } from '@/components/pipelines/pipeline-delete-dialog'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/initiative-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { PipelineWithStages } from '@/types'
import { useScopedDepartmentIds, matchesDepartmentScope } from '@/hooks/use-department-scope'

const searchSchema = z.object({
  pipeline: z.string().optional(),
})

export const Route = createFileRoute('/initiatives')({
  validateSearch: searchSchema,
  loader: async () => {
    const [initiatives, pipelines, formOptions] = await Promise.all([
      fetchInitiatives(),
      fetchPipelines(),
      fetchInitiativeFormOptions(),
    ])
    return {
      initiatives,
      pipelines,
      refusalReasons: formOptions.refusalReasons,
      departments: formOptions.departments,
    }
  },
  component: RouteComponent,
})

type ViewMode = 'kanban' | 'list'

function RouteComponent() {
  const { initiatives, pipelines, refusalReasons, departments } =
    Route.useLoaderData()
  const search = useSearch({ from: '/initiatives' })
  const router = useRouter()

  const scopedDeptIds = useScopedDepartmentIds()

  const visiblePipelines = React.useMemo(() => {
    if (!scopedDeptIds) return pipelines
    return pipelines.filter(
      (p) => p.departmentIds.length === 0 || p.departmentIds.some((id) => scopedDeptIds.has(id)),
    )
  }, [pipelines, scopedDeptIds])

  const [viewMode, setViewMode] = React.useState<ViewMode>('kanban')
  const [selectedPipelineId, setSelectedPipelineId] = React.useState<string>(
    search.pipeline ?? visiblePipelines.at(0)?.id ?? '',
  )
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [departmentFilter, setDepartmentFilter] = React.useState<string[]>([])
  const [pipelineFormOpen, setPipelineFormOpen] = React.useState(false)
  const [editingPipeline, setEditingPipeline] =
    React.useState<PipelineWithStages | null>(null)
  const [pipelineToDelete, setPipelineToDelete] =
    React.useState<PipelineWithStages | null>(null)
  const [newMeetingOpen, setNewMeetingOpen] = React.useState(false)
  const [newProposalOpen, setNewProposalOpen] = React.useState(false)

  // Derived: fall back to first visible pipeline when the selected one is gone or filtered out
  const selectedPipeline =
    visiblePipelines.find((p) => p.id === selectedPipelineId) ?? visiblePipelines.at(0)
  const effectivePipelineId = selectedPipeline?.id ?? ''

  const responsibleNames = Array.from(
    new Set(initiatives.map((i) => i.responsibleUserName).filter(Boolean)),
  ).sort((a, b) => a!.localeCompare(b!, 'ru'))
  const responsibleOptions = responsibleNames.map((name) => ({
    value: name!,
    label: name!,
  }))

  // Show every available department in the filter, not only ones that already
  // appear in an existing initiative — otherwise newly-created depts (or those
  // with no initiatives yet) are invisible to the user. Respect global scope.
  const departmentOptions = departments
    .filter((d) => !scopedDeptIds || scopedDeptIds.has(d.id))
    .map((d) => ({ value: d.id, label: d.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))

  const filtered = initiatives.filter((i) => {
    if (effectivePipelineId && i.pipelineId !== effectivePipelineId)
      return false
    if (!matchesDepartmentScope(scopedDeptIds, i.departmentId))
      return false
    if (
      responsibleFilter.length > 0 &&
      (!i.responsibleUserName ||
        !responsibleFilter.includes(i.responsibleUserName))
    )
      return false
    if (
      departmentFilter.length > 0 &&
      (!i.departmentId || !departmentFilter.includes(i.departmentId))
    )
      return false
    return true
  })

  const hasFilters = responsibleFilter.length > 0 || departmentFilter.length > 0

  const openCreatePipeline = () => {
    setEditingPipeline(null)
    setPipelineFormOpen(true)
  }

  const openEditPipeline = (p: PipelineWithStages) => {
    setEditingPipeline(p)
    setPipelineFormOpen(true)
  }

  const handlePipelineFormSuccess = async (newId?: string) => {
    setPipelineFormOpen(false)
    setEditingPipeline(null)
    await router.invalidate()
    if (newId) setSelectedPipelineId(newId)
  }

  if (pipelines.length === 0) {
    return (
      <>
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GitMergeIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>
            Нет ни одной воронки продаж. Создайте воронку, чтобы начать работать
            с инициативами.
          </EmptyDescription>
          <EmptyContent>
            <Button onClick={openCreatePipeline}>
              <PlusIcon className="mr-1.5 size-4" />
              Создать воронку
            </Button>
          </EmptyContent>
        </Empty>

        <PipelineFormDialog
          open={pipelineFormOpen}
          onOpenChange={(open) => {
            setPipelineFormOpen(open)
            if (!open) setEditingPipeline(null)
          }}
          pipeline={editingPipeline ?? undefined}
          departmentOptions={departments}
          onSuccess={handlePipelineFormSuccess}
        />
        <Outlet />
      </>
    )
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PipelineTabs
          pipelines={visiblePipelines}
          selectedId={effectivePipelineId}
          onSelect={setSelectedPipelineId}
          onCreate={openCreatePipeline}
          onEdit={openEditPipeline}
          onDelete={setPipelineToDelete}
        />

        {responsibleOptions.length > 0 && (
          <MultiFilterCombobox
            options={responsibleOptions}
            value={responsibleFilter}
            onValueChange={setResponsibleFilter}
            placeholder="Ответственные"
            emptyText="Не найдены"
          />
        )}

        {departmentOptions.length > 0 && (
          <MultiFilterCombobox
            options={departmentOptions}
            value={departmentFilter}
            onValueChange={setDepartmentFilter}
            placeholder="Подразделения"
            emptyText="Не найдены"
          />
        )}

        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResponsibleFilter([])
              setDepartmentFilter([])
            }}
          >
            <XIcon className="size-4" />
            Сбросить
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewMeetingOpen(true)}
          >
            <CalendarPlusIcon className="size-4" />
            Новая встреча
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewProposalOpen(true)}
          >
            <FileTextIcon className="size-4" />
            Новое КП
          </Button>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="h-8"
          >
            <ToggleGroupItem value="kanban" className="h-8 px-2.5">
              <KanbanIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="h-8 px-2.5">
              <LayoutListIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {viewMode === 'kanban' && selectedPipeline ? (
        <KanbanBoard
          pipeline={selectedPipeline}
          initiatives={filtered}
          refusalReasons={refusalReasons}
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <PipelineFormDialog
        open={pipelineFormOpen}
        onOpenChange={(open) => {
          setPipelineFormOpen(open)
          if (!open) setEditingPipeline(null)
        }}
        pipeline={editingPipeline ?? undefined}
        departmentOptions={departments}
        onSuccess={handlePipelineFormSuccess}
      />

      <PipelineDeleteDialog
        pipelineId={pipelineToDelete?.id ?? null}
        pipelineName={pipelineToDelete?.name}
        onClose={() => setPipelineToDelete(null)}
        onDeleted={() => router.invalidate()}
      />

      <ResponsiveDialog
        open={newMeetingOpen}
        onOpenChange={setNewMeetingOpen}
        title="Новая встреча"
      >
        <MeetingForm
          onSuccess={async () => {
            setNewMeetingOpen(false)
            await router.invalidate()
          }}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={newProposalOpen}
        onOpenChange={setNewProposalOpen}
        title="Новое КП"
      >
        <ProposalForm
          onSuccess={async () => {
            setNewProposalOpen(false)
            await router.invalidate()
          }}
        />
      </ResponsiveDialog>

      <Outlet />
    </>
  )
}
