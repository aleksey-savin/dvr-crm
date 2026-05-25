import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { fetchStages } from '@/components/pipeline-entity/stage-actions'
import { fetchPipelines } from '@/components/pipelines/actions'
import { EntityView } from '@/components/pipeline-entity/entity-view'
import { leadConfig } from '@/components/leads/config'
import { tenderConfig } from '@/components/tenders/config'
import { signalConfig } from '@/components/signals/config'
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
      const [rows, stages, pipelines] = await Promise.all([
        tenderConfig.fetch({}),
        fetchStages({ data: { entityType: 'tender' } }),
        fetchPipelines(),
      ])
      return { tab: 'tenders' as const, rows, stages, pipelines }
    }
    if (tab === 'signals') {
      const [rows, stages, pipelines] = await Promise.all([
        signalConfig.fetch({}),
        fetchStages({ data: { entityType: 'signal' } }),
        fetchPipelines(),
      ])
      return { tab: 'signals' as const, rows, stages, pipelines }
    }
    const [rows, stages, pipelines] = await Promise.all([
      leadConfig.fetch({}),
      fetchStages({ data: { entityType: 'lead' } }),
      fetchPipelines(),
    ])
    return { tab: 'leads' as const, rows, stages, pipelines }
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
        <EntityView
          config={leadConfig}
          rows={data.rows}
          stages={data.stages}
          pipelines={data.pipelines}
        />
      )}
      {data.tab === 'tenders' && (
        <EntityView
          config={tenderConfig}
          rows={data.rows}
          stages={data.stages}
          pipelines={data.pipelines}
        />
      )}
      {data.tab === 'signals' && (
        <EntityView
          config={signalConfig}
          rows={data.rows}
          stages={data.stages}
          pipelines={data.pipelines}
        />
      )}

      <Outlet />
    </>
  )
}
