import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { TagIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/tag-cols'
import { fetchTags } from '@/components/tags/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { TagRow } from '@/types'

export const Route = createFileRoute('/tags')({
  loader: () => fetchTags(),
  component: RouteComponent,
})

function RouteComponent() {
  const tags = Route.useLoaderData()

  const rows: TagRow[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: new Date(t.createdAt),
  }))

  return (
    <>
      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TagIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Теги не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/tags/new" className="flex items-center gap-2">
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
