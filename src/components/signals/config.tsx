import { RadioIcon } from 'lucide-react'
import { SignalForm } from './signal-form'
import {
  fetchSignals,
  fetchSignal,
  moveSignalStage,
  rejectSignal,
  archiveSignal,
} from './actions'
import { convertSignalToInitiative } from '@/components/initiatives/actions'
import { getSignalColumns } from '@/components/tables/signal-cols'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import type { EntityConfig } from '@/components/pipeline-entity/types'
import type { SignalRow } from '@/types'
import type { SelectSignal } from '@/db/types'

export const signalConfig: EntityConfig<SignalRow, SelectSignal> = {
  type: 'signal',
  words: {
    nom: 'Сигнал',
    acc: 'сигнал',
    gen: 'сигнала',
    plural: 'Сигналы',
    genPlural: 'Сигналов',
  },
  newRoute: '/signals/new',
  emptyIcon: RadioIcon,

  fetch: ({ includeArchived } = {}) =>
    fetchSignals({ data: { includeArchived } }),
  fetchOne: (id) =>
    fetchSignal({ data: { id } }) as unknown as Promise<SelectSignal>,
  move: (id, stageId) => moveSignalStage({ data: { id, stageId } }),
  reject: (id, lostReasonId) => rejectSignal({ data: { id, lostReasonId } }),
  archive: (id) => archiveSignal({ data: { id } }),
  convert: (row, { pipelineId, stageId }) =>
    convertSignalToInitiative({
      data: {
        signalId: row.id,
        title: row.title,
        pipelineId,
        stageId,
        companyId: row.companyId,
        departmentId: row.departmentId,
        responsibleUserId: row.responsibleUserId,
      },
    }),

  renderForm: ({ item, onSuccess }) => (
    <SignalForm item={item} onSuccess={onSuccess} />
  ),
  renderCardFooter: (row) => (
    <>
      <div className="flex min-w-0 items-center gap-1.5">
        {row.signalTypeName && (
          <Badge variant="outline" className="shrink-0">
            {row.signalTypeName}
          </Badge>
        )}
        <span className="truncate text-xs text-muted-foreground">
          {row.responsibleUserName ?? '—'}
        </span>
      </div>
      {row.rating != null && <StarRating value={row.rating} readonly />}
    </>
  ),
  getColumns: () => getSignalColumns(),
  matchesSearch: (row, q) =>
    row.title.toLowerCase().includes(q) ||
    (row.companyName?.toLowerCase().includes(q) ?? false),
  extraFilters: [
    {
      key: 'type',
      placeholder: 'Типы',
      emptyText: 'Не найдены',
      getOptions: (rows): TableFilterOption[] => {
        const seen = new Map<string, string>()
        for (const r of rows) {
          if (r.signalTypeId && r.signalTypeName)
            seen.set(r.signalTypeId, r.signalTypeName)
        }
        return Array.from(seen.entries())
          .map(([id, name]) => ({ value: id, label: name }))
          .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
      },
      matches: (row, selected) =>
        !!row.signalTypeId && selected.includes(row.signalTypeId),
    },
  ],
}
