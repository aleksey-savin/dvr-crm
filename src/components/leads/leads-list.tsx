import * as React from 'react'
import { ZapIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { leadColumns } from '@/components/tables/lead-cols'
import { usePipelinesStore } from '@/stores/pipelines-store'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { LeadRow, PipelineWithStages } from '@/types'

export function LeadsList({
  leads,
  pipelines,
}: {
  leads: LeadRow[]
  pipelines: PipelineWithStages[]
}) {
  const setPipelines = usePipelinesStore((s) => s.setPipelines)
  React.useEffect(() => {
    setPipelines(pipelines)
  }, [pipelines, setPipelines])

  if (leads.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ZapIcon />
          </EmptyMedia>
        </EmptyHeader>
        <EmptyDescription>Лидов пока нет</EmptyDescription>
      </Empty>
    )
  }

  return <DataTable columns={leadColumns} data={leads} hideSearch />
}
