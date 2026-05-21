import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { fetchLeads, fetchLeadStages } from '@/components/leads/actions'
import { fetchTenders } from '@/components/tenders/actions'
import { fetchSignals } from '@/components/signals/actions'
import { fetchPipelines } from '@/components/pipelines/actions'
import { LeadsView } from '@/components/leads/leads-view'
import { TendersList } from '@/components/tenders/tenders-list'
import { SignalsList } from '@/components/signals/signals-list'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const SOURCE_TABS = ['leads', 'tenders', 'signals'] as const
type SourceTab = (typeof SOURCE_TABS)[number]

export const Route = createFileRoute('/sources')({
  validateSearch: (search: Record<string, unknown>): { tab: SourceTab } => ({
    tab: SOURCE_TABS.includes(search.tab as SourceTab)
      ? (search.tab as SourceTab)
      : 'leads',
  }),
  loaderDeps: ({ search: { tab } }) => ({ tab }),
  loader: async ({ deps: { tab } }) => {
    if (tab === 'tenders') {
      const tenders = await fetchTenders()
      return { tab, tenders } as const
    }
    if (tab === 'signals') {
      const [signals, pipelines] = await Promise.all([
        fetchSignals(),
        fetchPipelines(),
      ])
      return { tab, signals, pipelines } as const
    }
    const [leads, leadStages, pipelines] = await Promise.all([
      fetchLeads({ data: {} }),
      fetchLeadStages(),
      fetchPipelines(),
    ])
    return { tab, leads, leadStages, pipelines } as const
  },
  component: RouteComponent,
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const router = useRouter()

  const handleTabChange = (value: string) => {
    router.navigate({
      to: '/sources',
      search: { tab: value as SourceTab },
      replace: true,
    })
  }

  return (
    <>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="leads">Лиды</TabsTrigger>
          <TabsTrigger value="tenders">Тендеры</TabsTrigger>
          <TabsTrigger value="signals">Сигналы</TabsTrigger>
        </TabsList>
      </Tabs>

      {data.tab === 'leads' && (
        <LeadsView
          leads={data.leads}
          stages={data.leadStages}
          pipelines={data.pipelines}
        />
      )}
      {data.tab === 'tenders' && <TendersList tenders={data.tenders} />}
      {data.tab === 'signals' && (
        <SignalsList signals={data.signals} pipelines={data.pipelines} />
      )}

      <Outlet />
    </>
  )
}
