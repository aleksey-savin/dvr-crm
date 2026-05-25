import { CalendarIcon, FileTextIcon } from 'lucide-react'
import { TenderForm } from './tender-form'
import {
  fetchTenders,
  fetchTender,
  moveTenderStage,
  rejectTender,
  archiveTender,
} from './actions'
import { convertTenderToInitiative } from '@/components/initiatives/actions'
import { getTenderColumns } from '@/components/tables/tender-cols'
import { cn } from '@/lib/utils'
import type { EntityConfig } from '@/components/pipeline-entity/types'
import type { TenderRow } from '@/types'
import type { SelectTender } from '@/db/types'

export const tenderConfig: EntityConfig<TenderRow, SelectTender> = {
  type: 'tender',
  words: {
    nom: 'Тендер',
    acc: 'тендер',
    gen: 'тендера',
    plural: 'Тендеры',
    genPlural: 'Тендеров',
  },
  newRoute: '/tenders/new',
  emptyIcon: FileTextIcon,

  fetch: ({ includeArchived } = {}) =>
    fetchTenders({ data: { includeArchived } }),
  fetchOne: (id) =>
    fetchTender({ data: { id } }) as unknown as Promise<SelectTender>,
  move: (id, stageId) => moveTenderStage({ data: { id, stageId } }),
  reject: (id, lostReasonId) => rejectTender({ data: { id, lostReasonId } }),
  archive: (id) => archiveTender({ data: { id } }),
  convert: (row, { pipelineId, stageId }) =>
    convertTenderToInitiative({
      data: {
        tenderId: row.id,
        title: row.title,
        pipelineId,
        stageId,
        companyId: row.companyId,
        departmentId: row.departmentId,
        responsibleUserId: row.responsibleUserId,
        budget: row.amount,
        dueDate: row.deadline,
      },
    }),

  renderForm: ({ item, onSuccess }) => (
    <TenderForm item={item} onSuccess={onSuccess} />
  ),
  renderCardFooter: (row) => {
    const isOverdue = row.deadline && new Date(row.deadline) < new Date()
    return (
      <>
        <span className="truncate text-xs text-muted-foreground">
          {row.platform ?? row.responsibleUserName ?? '—'}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {row.amount && (
            <span className="text-xs font-medium tabular-nums">
              {new Intl.NumberFormat('ru-RU', {
                notation: 'compact',
                currency: 'RUB',
                style: 'currency',
                maximumFractionDigits: 1,
              }).format(Number(row.amount))}
            </span>
          )}
          {row.deadline && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs',
                isOverdue ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="size-3" />
              {new Date(row.deadline).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </>
    )
  },
  getColumns: () => getTenderColumns(),
  matchesSearch: (row, q) =>
    row.title.toLowerCase().includes(q) ||
    (row.companyName?.toLowerCase().includes(q) ?? false) ||
    (row.platform?.toLowerCase().includes(q) ?? false),
}
