import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { KanbanIcon, LayoutListIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import { LeadsList } from './leads-list'
import { LeadKanban } from './lead-kanban'
import { fetchLeads } from './actions'
import { fetchRefusalReasons } from '@/components/refusal-reasons/actions'
import {
  matchesDepartmentScope,
  useScopedDepartmentIds,
} from '@/hooks/use-department-scope'
import type { LeadRow, LeadStageOption, PipelineWithStages } from '@/types'

type ViewMode = 'kanban' | 'list'

export function LeadsView({
  leads,
  stages,
  pipelines,
}: {
  leads: LeadRow[]
  stages: LeadStageOption[]
  pipelines: PipelineWithStages[]
}) {
  const router = useRouter()
  const scopedDeptIds = useScopedDepartmentIds()
  const [viewMode, setViewMode] = React.useState<ViewMode>('kanban')
  const [showArchived, setShowArchived] = React.useState(false)
  const [archivedLeads, setArchivedLeads] = React.useState<LeadRow[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])
  const [industryFilter, setIndustryFilter] = React.useState<string[]>([])
  const [query, setQuery] = React.useState('')
  const [refusalReasons, setRefusalReasons] = React.useState<
    Array<{ id: string; name: string }>
  >([])

  React.useEffect(() => {
    fetchRefusalReasons().then(setRefusalReasons).catch(console.error)
  }, [])

  const loadArchived = React.useCallback(async () => {
    const all = await fetchLeads({ data: { includeArchived: true } })
    setArchivedLeads(all)
  }, [])

  const refresh = React.useCallback(async () => {
    await router.invalidate()
    if (showArchived) await loadArchived()
  }, [router, showArchived, loadArchived])

  const handleToggleArchived = async () => {
    const next = !showArchived
    setShowArchived(next)
    if (next) await loadArchived()
  }

  const base = (showArchived ? archivedLeads : leads).filter((l) =>
    matchesDepartmentScope(scopedDeptIds, l.departmentId),
  )

  const responsibleOptions: TableFilterOption[] = Array.from(
    new Set(
      base.map((l) => l.responsibleUserName).filter((n): n is string => !!n),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const industryOptions: TableFilterOption[] = (() => {
    const seen = new Map<string, string>()
    for (const l of base) {
      if (l.industryId && l.industryName) seen.set(l.industryId, l.industryName)
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  })()

  const q = query.trim().toLowerCase()
  const filtered = base.filter((l) => {
    if (
      q &&
      !(
        l.title.toLowerCase().includes(q) ||
        (l.companyName?.toLowerCase().includes(q) ?? false)
      )
    )
      return false
    if (
      responsibleFilter.length > 0 &&
      (!l.responsibleUserName ||
        !responsibleFilter.includes(l.responsibleUserName))
    )
      return false
    if (
      industryFilter.length > 0 &&
      (!l.industryId || !industryFilter.includes(l.industryId))
    )
      return false
    return true
  })

  const hasFilters = responsibleFilter.length > 0 || industryFilter.length > 0

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Поиск..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-44"
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResponsibleFilter([])
              setIndustryFilter([])
            }}
          >
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
        <LeadKanban
          leads={filtered}
          stages={stages}
          pipelines={pipelines}
          refusalReasons={refusalReasons}
          onMutated={refresh}
        />
      ) : (
        <LeadsList leads={filtered} pipelines={pipelines} />
      )}
    </div>
  )
}
