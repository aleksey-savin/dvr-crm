import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ZapIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/lead-cols'
import { fetchLeads } from '@/components/leads/actions'
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
import type { LeadStatus } from '@/types'

export const Route = createFileRoute('/leads')({
  loader: () => fetchLeads(),
  component: RouteComponent,
})

const STATUS_LABELS: Record<LeadStatus | 'all', string> = {
  all: 'Все статусы',
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  rejected: 'Отклонён',
}

function RouteComponent() {
  const leads = Route.useLoaderData()

  const [statusFilter, setStatusFilter] = React.useState<LeadStatus | 'all'>('all')
  const [responsibleFilter, setResponsibleFilter] = React.useState<string>('all')
  const [industryFilter, setIndustryFilter] = React.useState<string>('all')

  const responsibles = React.useMemo(() => {
    const names = leads
      .map((l) => l.responsibleUserName)
      .filter((n): n is string => n !== null)
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [leads])

  const industries = React.useMemo(() => {
    const entries = leads
      .filter((l) => l.industryId !== null && l.industryName !== null)
      .map((l) => ({ id: l.industryId!, name: l.industryName! }))
    const seen = new Map<string, string>()
    for (const e of entries) seen.set(e.id, e.name)
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [leads])

  const filtered = leads.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (responsibleFilter !== 'all' && l.responsibleUserName !== responsibleFilter) return false
    if (industryFilter !== 'all' && l.industryId !== industryFilter) return false
    return true
  })

  return (
    <>
      {leads.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ZapIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Лидов пока нет</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/leads/new" className="flex items-center gap-2">
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
                onValueChange={(v) => setStatusFilter(v as LeadStatus | 'all')}
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
                <Link to="/leads/new" className="flex items-center gap-2">
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
