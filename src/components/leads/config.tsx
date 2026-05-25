import { CalendarIcon, ZapIcon } from 'lucide-react'
import { LeadForm } from './lead-form'
import {
  fetchLeads,
  fetchLead,
  moveLeadStage,
  rejectLead,
  archiveLead,
} from './actions'
import { convertLeadToInitiative } from '@/components/initiatives/actions'
import { leadColumns } from '@/components/tables/lead-cols'
import { cn } from '@/lib/utils'
import type { EntityConfig } from '@/components/pipeline-entity/types'
import type { LeadRow } from '@/types'
import type { SelectLead } from '@/db/types'

export const leadConfig: EntityConfig<LeadRow, SelectLead> = {
  type: 'lead',
  words: {
    nom: 'Лид',
    acc: 'лид',
    gen: 'лида',
    plural: 'Лиды',
    genPlural: 'Лидов',
  },
  newRoute: '/leads/new',
  emptyIcon: ZapIcon,

  fetch: ({ includeArchived } = {}) =>
    fetchLeads({ data: { includeArchived } }),
  fetchOne: (id) =>
    fetchLead({ data: { id } }) as unknown as Promise<SelectLead>,
  move: (id, stageId) => moveLeadStage({ data: { id, stageId } }),
  reject: (id, lostReasonId) => rejectLead({ data: { id, lostReasonId } }),
  archive: (id) => archiveLead({ data: { id } }),
  convert: (row, { pipelineId, stageId }) =>
    convertLeadToInitiative({
      data: {
        leadId: row.id,
        title: row.title,
        pipelineId,
        stageId,
        companyId: row.companyId,
        departmentId: row.departmentId,
        responsibleUserId: row.responsibleUserId,
        budget: row.budget,
        dueDate: row.dueDate,
      },
    }),

  renderForm: ({ item, onSuccess }) => (
    <LeadForm item={item} onSuccess={onSuccess} />
  ),
  renderCardFooter: (row) => {
    const isOverdue = row.dueDate && new Date(row.dueDate) < new Date()
    return (
      <>
        <span className="truncate text-xs text-muted-foreground">
          {row.responsibleUserName ?? '—'}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {row.budget && (
            <span className="text-xs font-medium tabular-nums">
              {new Intl.NumberFormat('ru-RU', {
                notation: 'compact',
                currency: 'RUB',
                style: 'currency',
                maximumFractionDigits: 1,
              }).format(Number(row.budget))}
            </span>
          )}
          {row.dueDate && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs',
                isOverdue ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="size-3" />
              {new Date(row.dueDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </>
    )
  },
  getColumns: () => leadColumns,
  matchesSearch: (row, q) =>
    row.title.toLowerCase().includes(q) ||
    (row.companyName?.toLowerCase().includes(q) ?? false),
}
