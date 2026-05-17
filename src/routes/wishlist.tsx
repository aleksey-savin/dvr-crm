import * as React from 'react'
import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { ListIcon, Plus, XIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/companyAccounts/wishlist-cols'
import { MultiFilterCombobox } from '@/components/tables/multi-filter-combobox'
import type { TableFilterOption } from '@/components/tables/multi-filter-combobox'
import {
  fetchWishlistAccounts,
  reorderWishlistAccounts,
} from '@/components/companyAccounts/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { WishlistAccountRow } from '@/types'
import { toast } from 'sonner'
import { useDepartmentStore } from '@/stores/department-store'

export const Route = createFileRoute('/wishlist')({
  component: RouteComponent,
  loader: () => fetchWishlistAccounts(),
})

type WishlistGroupFilter =
  | 'all'
  | 'top10'
  | 'top20'
  | 'top30'
  | 'basement'
  | 'archived'
  | 'unranked'

type WishlistGroupKey = Exclude<WishlistGroupFilter, 'all'>

const WISHLIST_GROUPS: Array<{ key: WishlistGroupKey; label: string }> = [
  { key: 'top10', label: 'Топ-10' },
  { key: 'top20', label: 'Топ-20' },
  { key: 'top30', label: 'Топ-30' },
  { key: 'basement', label: 'Подвал' },
  { key: 'archived', label: 'Архив' },
  { key: 'unranked', label: 'Без позиции' },
]

function getWishlistGroup(row: WishlistAccountRow): WishlistGroupKey {
  if (row.wishlistState === 'basement') return 'basement'
  if (row.wishlistState === 'archived') return 'archived'
  if (!row.position || row.position < 1) return 'unranked'
  if (row.position <= 10) return 'top10'
  if (row.position <= 20) return 'top20'
  if (row.position <= 30) return 'top30'
  return 'unranked'
}

function collectDescendantIds(
  departments: Array<{ id: string; parentId?: string | null }>,
  rootId: string,
): string[] {
  const result = new Set([rootId])
  const queue = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const d of departments) {
      if (d.parentId === current && !result.has(d.id)) {
        result.add(d.id)
        queue.push(d.id)
      }
    }
  }
  return Array.from(result)
}

function normalizeRankedGroups(
  groups: Record<WishlistGroupKey, WishlistAccountRow[]>,
) {
  const top10Overflow = groups.top10.splice(10)
  groups.top20.unshift(...top10Overflow)

  const top20Overflow = groups.top20.splice(10)
  groups.top30.unshift(...top20Overflow)

  const top30Overflow = groups.top30.splice(10)
  groups.unranked.unshift(...top30Overflow)
}

function buildWishlistReorderGroups({
  activeId,
  overId,
  groupKey,
  rows,
}: {
  activeId: string
  overId?: string
  groupKey?: string
  rows: WishlistAccountRow[]
}) {
  const activeRow = rows.find((row) => row.id === activeId)
  if (!activeRow) return []

  const overRow = overId ? rows.find((row) => row.id === overId) : undefined
  const targetGroup = (groupKey ??
    (overRow ? getWishlistGroup(overRow) : undefined)) as
    | WishlistGroupKey
    | undefined
  if (!targetGroup || targetGroup === 'unranked') return []

  const groups: Record<WishlistGroupKey, WishlistAccountRow[]> = {
    top10: [],
    top20: [],
    top30: [],
    basement: [],
    archived: [],
    unranked: [],
  }

  for (const row of rows) {
    if (row.id === activeId) continue
    groups[getWishlistGroup(row)].push(row)
  }

  const targetRows = groups[targetGroup]
  const overIndex = overId
    ? targetRows.findIndex((row) => row.id === overId)
    : -1
  targetRows.splice(
    overIndex >= 0 ? overIndex : targetRows.length,
    0,
    activeRow,
  )
  normalizeRankedGroups(groups)

  return WISHLIST_GROUPS.map(({ key }) => ({
    groupKey: key,
    orderedIds: groups[key].map((row) => row.id),
  }))
}

function RouteComponent() {
  const items = Route.useLoaderData()
  const router = useRouter()
  const selectedDepartmentId = useDepartmentStore((s) => s.selectedDepartmentId)
  const departments = useDepartmentStore((s) => s.departments)
  const selectedDept = departments.find((d) => d.id === selectedDepartmentId)

  const [groupFilter, setGroupFilter] =
    React.useState<WishlistGroupFilter>('all')
  const [industryFilter, setIndustryFilter] = React.useState<string[]>([])
  const [responsibleFilter, setResponsibleFilter] = React.useState<string[]>([])

  const filterIds = (() => {
    if (!selectedDepartmentId) return null
    if (selectedDept?.departmentType === 'administrative') {
      return collectDescendantIds(departments, selectedDepartmentId)
    }
    return [selectedDepartmentId]
  })()

  const departmentFiltered = filterIds
    ? items.filter((item) =>
        item.businessUnitIds.some((id) => filterIds.includes(id)),
      )
    : items

  const industryOptions: Array<TableFilterOption> = Array.from(
    new Set(
      departmentFiltered
        .map((i) => i.industry)
        .filter((n): n is string => n !== null),
    ),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const responsibleOptions: Array<TableFilterOption> = Array.from(
    new Set(departmentFiltered.flatMap((i) => i.responsibles)),
  )
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .map((name) => ({ value: name, label: name }))

  const activeIndustryFilter = industryFilter.filter((industry) =>
    industryOptions.some((option) => option.value === industry),
  )
  const activeResponsibleFilter = responsibleFilter.filter((responsible) =>
    responsibleOptions.some((option) => option.value === responsible),
  )

  const filtered = departmentFiltered.filter((i) => {
    if (
      activeIndustryFilter.length > 0 &&
      !activeIndustryFilter.includes(i.industry ?? '')
    )
      return false
    if (
      activeResponsibleFilter.length > 0 &&
      !i.responsibles.some((name) => activeResponsibleFilter.includes(name))
    )
      return false
    return true
  })

  const top10Count = filtered.filter(
    (row) => getWishlistGroup(row) === 'top10',
  ).length
  const top20Count = filtered.filter(
    (row) => getWishlistGroup(row) === 'top20',
  ).length
  const top30Count = filtered.filter(
    (row) => getWishlistGroup(row) === 'top30',
  ).length
  const basementCount = filtered.filter(
    (row) => getWishlistGroup(row) === 'basement',
  ).length
  const archivedCount = filtered.filter(
    (row) => getWishlistGroup(row) === 'archived',
  ).length
  const unrankedCount = filtered.filter(
    (row) => getWishlistGroup(row) === 'unranked',
  ).length

  const visibleRows =
    groupFilter === 'all'
      ? filtered
      : filtered.filter((row) => getWishlistGroup(row) === groupFilter)

  const hasFilters =
    groupFilter !== 'all' ||
    activeIndustryFilter.length > 0 ||
    activeResponsibleFilter.length > 0
  const canReorder =
    activeIndustryFilter.length === 0 && activeResponsibleFilter.length === 0

  const rowClassName = (row: WishlistAccountRow) => {
    const group = getWishlistGroup(row)
    if (group === 'basement')
      return 'border-l-2 border-l-red-500/35 bg-red-500/5 hover:bg-red-500/10'
    if (group === 'archived')
      return 'border-l-2 border-l-muted-foreground/30 bg-muted/30 hover:bg-muted/50'
    if (group === 'top10')
      return 'border-l-2 border-l-emerald-500/35 bg-emerald-500/5 hover:bg-emerald-500/10'
    if (group === 'top20')
      return 'border-l-2 border-l-amber-500/35 bg-amber-500/5 hover:bg-amber-500/10'
    if (group === 'top30')
      return 'border-l-2 border-l-sky-500/35 bg-sky-500/5 hover:bg-sky-500/10'
    return 'border-l-2 border-l-border bg-muted/10 hover:bg-muted/30'
  }

  return (
    <>
      {departmentFiltered.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет клиентов в вишлисте</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/wishlist/new" className="flex items-center gap-2">
                <Plus /> Добавить
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={visibleRows}
          rowClassName={rowClassName}
          groupBy={
            groupFilter === 'all'
              ? {
                  getKey: getWishlistGroup,
                  groups: WISHLIST_GROUPS,
                }
              : undefined
          }
          rowReorder={
            canReorder
              ? {
                  getId: (row) => row.id,
                  onDrop: async (args) => {
                    const groups = buildWishlistReorderGroups(args)
                    if (groups.length === 0) return

                    try {
                      await reorderWishlistAccounts({ data: { groups } })
                      toast.success('Порядок обновлён')
                      router.invalidate()
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : 'Не удалось обновить порядок',
                      )
                    }
                  },
                }
              : undefined
          }
          toolbar={
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              {industryOptions.length > 0 && (
                <MultiFilterCombobox
                  options={industryOptions}
                  value={activeIndustryFilter}
                  onValueChange={setIndustryFilter}
                  placeholder="Отрасли"
                  emptyText="Отрасли не найдены"
                />
              )}
              {responsibleOptions.length > 0 && (
                <MultiFilterCombobox
                  options={responsibleOptions}
                  value={activeResponsibleFilter}
                  onValueChange={setResponsibleFilter}
                  placeholder="Ответственные"
                  emptyText="Ответственные не найдены"
                />
              )}
              <ToggleGroup
                type="single"
                value={groupFilter}
                onValueChange={(value) => {
                  if (value) setGroupFilter(value as WishlistGroupFilter)
                }}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="all" className="gap-2">
                  Все <Badge variant="secondary">{filtered.length}</Badge>
                </ToggleGroupItem>
                <ToggleGroupItem value="top10" className="gap-2">
                  Топ-10 <Badge variant="secondary">{top10Count}</Badge>
                </ToggleGroupItem>
                <ToggleGroupItem value="top20" className="gap-2">
                  Топ-20 <Badge variant="secondary">{top20Count}</Badge>
                </ToggleGroupItem>
                <ToggleGroupItem value="top30" className="gap-2">
                  Топ-30 <Badge variant="secondary">{top30Count}</Badge>
                </ToggleGroupItem>
                <ToggleGroupItem value="basement" className="gap-2">
                  Подвал <Badge variant="secondary">{basementCount}</Badge>
                </ToggleGroupItem>
                {(archivedCount > 0 || groupFilter === 'archived') && (
                  <ToggleGroupItem value="archived" className="gap-2">
                    Архив <Badge variant="secondary">{archivedCount}</Badge>
                  </ToggleGroupItem>
                )}
                {(unrankedCount > 0 || groupFilter === 'unranked') && (
                  <ToggleGroupItem value="unranked" className="gap-2">
                    Без позиции{' '}
                    <Badge variant="secondary">{unrankedCount}</Badge>
                  </ToggleGroupItem>
                )}
              </ToggleGroup>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGroupFilter('all')
                    setIndustryFilter([])
                    setResponsibleFilter([])
                  }}
                >
                  <XIcon className="size-4" />
                  Сбросить
                </Button>
              )}
            </div>
          }
        />
      )}

      <Outlet />
    </>
  )
}
