import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { KanbanIcon, LayoutListIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { usePersistedFilter } from '@/stores/filters-store'
import { EntityKanban } from './entity-kanban'
import { EntityList } from './entity-list'
import type { EntityConfig, EntityRowBase } from './types'
import { fetchRefusalReasons } from '@/components/refusal-reasons/actions'
import {
  matchesDepartmentScope,
  useScopedDepartmentIds,
} from '@/hooks/use-department-scope'
import type { EntityStageOption, PipelineWithStages } from '@/types'

type ViewMode = 'kanban' | 'list'

type EntityViewProps<TRow extends EntityRowBase, TFull> = {
  config: EntityConfig<TRow, TFull>
  rows: TRow[]
  stages: EntityStageOption[]
  pipelines: PipelineWithStages[]
}

export function EntityView<TRow extends EntityRowBase, TFull>({
  config,
  rows,
  stages,
  pipelines,
}: EntityViewProps<TRow, TFull>) {
  const router = useRouter()
  const scopedDeptIds = useScopedDepartmentIds()
  const filterScope = `pipeline-${config.type}`
  const [viewMode, setViewMode] = usePersistedFilter<ViewMode>(
    filterScope,
    'viewMode',
    'kanban',
  )
  const [showArchived, setShowArchived] = React.useState(false)
  const [archivedRows, setArchivedRows] = React.useState<TRow[]>([])
  const [responsibleFilter, setResponsibleFilter] = usePersistedFilter<
    string[]
  >(filterScope, 'responsible', [])
  const [industryFilter, setIndustryFilter] = usePersistedFilter<string[]>(
    filterScope,
    'industry',
    [],
  )
  const [extraFilterValues, setExtraFilterValues] = usePersistedFilter<
    Record<string, string[]>
  >(filterScope, 'extra', {})
  const [query, setQuery] = React.useState('')
  const [refusalReasons, setRefusalReasons] = React.useState<
    Array<{ id: string; name: string }>
  >([])

  React.useEffect(() => {
    fetchRefusalReasons({ data: { entityType: config.type } })
      .then(setRefusalReasons)
      .catch(console.error)
  }, [config.type])

  const loadArchived = React.useCallback(async () => {
    const all = await config.fetch({ includeArchived: true })
    setArchivedRows(all)
  }, [config])

  const refresh = React.useCallback(async () => {
    await router.invalidate()
    if (showArchived) await loadArchived()
  }, [router, showArchived, loadArchived])

  const handleToggleArchived = async () => {
    const next = !showArchived
    setShowArchived(next)
    if (next) await loadArchived()
  }

  const base = (showArchived ? archivedRows : rows).filter((r) =>
    matchesDepartmentScope(scopedDeptIds, r.departmentId),
  )

  const responsibleOptions: TableFilterOption[] = Array.from(
    new Set(
      base.map((r) => r.responsibleUserName).filter((n): n is string => !!n),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const industryOptions: TableFilterOption[] = (() => {
    const seen = new Map<string, string>()
    for (const r of base) {
      if (r.industryId && r.industryName) seen.set(r.industryId, r.industryName)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  })()

  const extraFilters = config.extraFilters ?? []

  const q = query.trim().toLowerCase()
  const filtered = base.filter((r) => {
    if (q && !config.matchesSearch(r, q)) return false
    if (
      responsibleFilter.length > 0 &&
      (!r.responsibleUserName ||
        !responsibleFilter.includes(r.responsibleUserName))
    )
      return false
    if (
      industryFilter.length > 0 &&
      (!r.industryId || !industryFilter.includes(r.industryId))
    )
      return false
    for (const f of extraFilters) {
      const selected = extraFilterValues[f.key] ?? []
      if (selected.length > 0 && !f.matches(r, selected)) return false
    }
    return true
  })

  const hasFilters =
    responsibleFilter.length > 0 ||
    industryFilter.length > 0 ||
    extraFilters.some((f) => (extraFilterValues[f.key] ?? []).length > 0)

  const resetFilters = () => {
    setResponsibleFilter([])
    setIndustryFilter([])
    setExtraFilterValues({})
  }

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Поиск..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-44"
        />
        {extraFilters.map((f) => {
          const options = f.getOptions(base)
          if (options.length === 0) return null
          return (
            <MultiFilterCombobox
              key={f.key}
              options={options}
              value={extraFilterValues[f.key] ?? []}
              onValueChange={(v) =>
                setExtraFilterValues((prev) => ({ ...prev, [f.key]: v }))
              }
              placeholder={f.placeholder}
              emptyText={f.emptyText}
            />
          )
        })}
        {responsibleOptions.length > 0 && (
          <MultiFilterCombobox
            options={responsibleOptions}
            value={responsibleFilter}
            onValueChange={setResponsibleFilter}
            placeholder="Ответственные"
            emptyText="Не найдены"
          />
        )}
        {industryOptions.length > 0 && (
          <MultiFilterCombobox
            options={industryOptions}
            value={industryFilter}
            onValueChange={setIndustryFilter}
            placeholder="Отрасли"
            emptyText="Не найдены"
          />
        )}
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <XIcon className="size-4" />
            Сбросить
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showArchived ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => void handleToggleArchived()}
          >
            {showArchived ? 'Скрыть архивные' : 'Показать архивные'}
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

      {viewMode === 'kanban' ? (
        <EntityKanban
          config={config}
          rows={filtered}
          stages={stages}
          pipelines={pipelines}
          refusalReasons={refusalReasons}
          onMutated={refresh}
        />
      ) : (
        <EntityList
          config={config}
          rows={filtered}
          stages={stages}
          pipelines={pipelines}
          refusalReasons={refusalReasons}
        />
      )}
    </div>
  )
}
