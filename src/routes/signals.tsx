import * as React from 'react'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { RadioIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/signal-cols'
import { fetchSignals } from '@/components/signals/actions'
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
import type { SignalStatus, SignalType } from '@/types'

export const Route = createFileRoute('/signals')({
  loader: () => fetchSignals(),
  component: RouteComponent,
})

const STATUS_LABELS: Record<SignalStatus | 'all', string> = {
  all: 'Все статусы',
  new: 'Новый',
  in_progress: 'В работе',
  converted: 'Конвертирован',
  archived: 'Архив',
}

const TYPE_LABELS: Record<SignalType | 'all', string> = {
  all: 'Все типы',
  recommendation: 'Рекомендация',
  news: 'Новость',
  direct_contact: 'Прямой контакт',
  other: 'Другое',
}

function RouteComponent() {
  const signals = Route.useLoaderData()

  const [statusFilter, setStatusFilter] = React.useState<SignalStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = React.useState<SignalType | 'all'>('all')
  const [responsibleFilter, setResponsibleFilter] = React.useState<string>('all')
  const [industryFilter, setIndustryFilter] = React.useState<string>('all')

  const responsibles = React.useMemo(() => {
    const names = signals
      .map((s) => s.responsibleUserName)
      .filter((n): n is string => n !== null)
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [signals])

  const industries = React.useMemo(() => {
    const entries = signals
      .filter((s) => s.industryId !== null && s.industryName !== null)
      .map((s) => ({ id: s.industryId!, name: s.industryName! }))
    const seen = new Map<string, string>()
    for (const e of entries) seen.set(e.id, e.name)
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [signals])

  const filtered = signals.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (typeFilter !== 'all' && s.signalType !== typeFilter) return false
    if (responsibleFilter !== 'all' && s.responsibleUserName !== responsibleFilter) return false
    if (industryFilter !== 'all' && s.industryId !== industryFilter) return false
    return true
  })

  return (
    <>
      {signals.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RadioIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Сигналов пока нет</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/signals/new" className="flex items-center gap-2">
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
                onValueChange={(v) => setStatusFilter(v as SignalStatus | 'all')}
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

              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as SignalType | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map((k) => (
                    <SelectItem key={k} value={k}>{TYPE_LABELS[k]}</SelectItem>
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
                <Link to="/signals/new" className="flex items-center gap-2">
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
