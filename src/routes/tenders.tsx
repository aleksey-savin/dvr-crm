import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { FileTextIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/tender-cols'
import { fetchTenders } from '@/components/tenders/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TenderStatus } from '@/types'

export const Route = createFileRoute('/tenders')({
  loader: () => fetchTenders(),
  component: RouteComponent,
})

const STATUS_LABELS: Record<TenderStatus | 'all', string> = {
  all: 'Все статусы',
  new: 'Новый',
  evaluation: 'Оценка',
  approval: 'Согласование',
  preparation: 'Подготовка',
  submitted: 'Подан',
  won: 'Выигран',
  lost: 'Проигран',
  rejected: 'Отклонён',
  archived: 'Архив',
}

function RouteComponent() {
  const tenders = Route.useLoaderData()

  const [statusFilter, setStatusFilter] = React.useState<TenderStatus | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = React.useState<string>('all')
  const [responsibleFilter, setResponsibleFilter] = React.useState<string>('all')
  const [industryFilter, setIndustryFilter] = React.useState<string>('all')

  const departments = React.useMemo(() => {
    const entries = tenders
      .filter((t) => t.departmentId !== null && t.departmentName !== null)
      .map((t) => ({ id: t.departmentId!, name: t.departmentName! }))
    const seen = new Map<string, string>()
    for (const e of entries) seen.set(e.id, e.name)
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [tenders])

  const responsibles = React.useMemo(() => {
    const names = tenders
      .map((t) => t.responsibleUserName)
      .filter((n): n is string => n !== null)
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [tenders])

  const industries = React.useMemo(() => {
    const entries = tenders
      .filter((t) => t.industryId !== null && t.industryName !== null)
      .map((t) => ({ id: t.industryId!, name: t.industryName! }))
    const seen = new Map<string, string>()
    for (const e of entries) seen.set(e.id, e.name)
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [tenders])

  const filtered = tenders.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (departmentFilter !== 'all' && t.departmentId !== departmentFilter) return false
    if (responsibleFilter !== 'all' && t.responsibleUserName !== responsibleFilter) return false
    if (industryFilter !== 'all' && t.industryId !== industryFilter) return false
    return true
  })

  return (
    <>
      {tenders.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Тендеров пока нет</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/tenders/new" className="flex items-center gap-2">
                <PlusIcon className="size-4" />
                Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TenderStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((k) => (
                    <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {departments.length > 0 && (
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Все подразделения" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все подразделения</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {responsibles.length > 0 && (
                <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Все ответственные" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все ответственные</SelectItem>
                    {responsibles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {industries.length > 0 && (
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Все отрасли" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все отрасли</SelectItem>
                    {industries.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button asChild className="ml-auto">
                <Link to="/tenders/new" className="flex items-center gap-2">
                  <PlusIcon className="size-4" />
                  Создать
                </Link>
              </Button>
            </div>
          }
        />
      )}

      <Outlet />
    </>
  )
}
