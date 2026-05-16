import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { LinkIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/source-cols'
import { fetchSources } from '@/components/sources/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { SourceRow } from '@/types'

export const Route = createFileRoute('/sources')({
  loader: () => fetchSources(),
  component: RouteComponent,
})

function RouteComponent() {
  const sources = Route.useLoaderData()

  const rows: SourceRow[] = sources.map((s) => ({
    id: s.id,
    name: s.name,
    createdAt: new Date(s.createdAt),
  }))

  return (
    <>
      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LinkIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Источники не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/sources/new" className="flex items-center gap-2">
                <PlusIcon className="size-4" />
                Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <Outlet />
    </>
  )
}
