import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { EntityActions } from './entity-actions'
import { EntityStageCell } from './entity-stage-cell'
import { EntitySheet } from './entity-sheet'
import type { EntityConfig, EntityRowBase, RefusalReason } from './types'
import type { EntityStageOption, PipelineWithStages } from '@/types'

type EntityListProps<TRow extends EntityRowBase, TFull> = {
  config: EntityConfig<TRow, TFull>
  rows: TRow[]
  stages: EntityStageOption[]
  pipelines: PipelineWithStages[]
  refusalReasons: RefusalReason[]
}

export function EntityList<TRow extends EntityRowBase, TFull>({
  config,
  rows,
  stages,
  pipelines,
  refusalReasons,
}: EntityListProps<TRow, TFull>) {
  const [selected, setSelected] = React.useState<TRow | null>(null)
  // Keep the open sheet in sync with refreshed data.
  const open = (selected && rows.find((r) => r.id === selected.id)) || selected

  const columns = React.useMemo<ColumnDef<TRow>[]>(
    () => [
      ...config.getColumns(),
      {
        id: 'stage',
        header: 'Этап',
        cell: ({ row }) => (
          <EntityStageCell
            stageId={row.original.stageId}
            stages={stages}
            onMove={(stageId) => config.move(row.original.id, stageId)}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <EntityActions
              config={config}
              row={row.original}
              pipelines={pipelines}
              refusalReasons={refusalReasons}
            />
          </div>
        ),
      },
    ],
    [config, stages, pipelines, refusalReasons],
  )

  if (rows.length === 0) {
    const Icon = config.emptyIcon
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        </EmptyHeader>
        <EmptyDescription>{config.words.genPlural} пока нет</EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        hideSearch
        onRowClick={setSelected}
      />

      <EntitySheet
        config={config}
        row={open}
        pipelines={pipelines}
        refusalReasons={refusalReasons}
        onOpenChange={(o) => {
          if (!o) setSelected(null)
        }}
      />
    </>
  )
}
