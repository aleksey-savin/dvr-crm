import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import type { EntityStatus, EntityType } from '@/types'

export type RefusalReason = { id: string; name: string }

export type ConvertArgs = { pipelineId: string; stageId: string }

/** Fields every pipeline entity row exposes — used by the generic shell. */
export type EntityRowBase = {
  id: string
  title: string
  status: EntityStatus
  stageId: string | null
  stageColor: string | null
  companyName: string | null
  departmentId: string | null
  departmentAccentColor: string | null
  responsibleUserName: string | null
  industryId: string | null
  industryName: string | null
  archivedAt: Date | null
}

/** Russian word forms used to derive all entity-specific UI strings. */
export type EntityWords = {
  /** Nominative singular, capitalised — "Лид". */
  nom: string
  /** Accusative singular, lowercase — "лид". */
  acc: string
  /** Genitive singular, lowercase — "лида". */
  gen: string
  /** Nominative plural, capitalised — "Лиды". */
  plural: string
  /** Genitive plural, capitalised — "Лидов". */
  genPlural: string
}

export type ExtraFilter<TRow> = {
  key: string
  placeholder: string
  emptyText: string
  getOptions: (rows: TRow[]) => TableFilterOption[]
  matches: (row: TRow, selected: string[]) => boolean
}

export type EntityConfig<TRow extends EntityRowBase, TFull> = {
  type: EntityType
  words: EntityWords
  newRoute: '/leads/new' | '/tenders/new' | '/signals/new'
  emptyIcon: LucideIcon

  fetch: (opts: { includeArchived?: boolean }) => Promise<TRow[]>
  fetchOne: (id: string) => Promise<TFull>
  move: (id: string, stageId: string) => Promise<unknown>
  reject: (id: string, lostReasonId: string) => Promise<unknown>
  archive: (id: string) => Promise<unknown>
  convert: (row: TRow, args: ConvertArgs) => Promise<{ id: string }>

  renderForm: (props: { item: TFull; onSuccess: () => void }) => ReactNode
  renderCardFooter: (row: TRow) => ReactNode
  getColumns: () => ColumnDef<TRow>[]

  matchesSearch: (row: TRow, q: string) => boolean
  extraFilters?: ExtraFilter<TRow>[]
}
