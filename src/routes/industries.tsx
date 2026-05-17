import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { FactoryIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/industry-cols'
import { fetchIndustries } from '@/components/industries/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { IndustryRow } from '@/types'

export const Route = createFileRoute('/industries')({
  loader: () => fetchIndustries(),
  component: RouteComponent,
})

function RouteComponent() {
  const industries = Route.useLoaderData()

  const rows: IndustryRow[] = industries.map((i) => ({
    id: i.id,
    name: i.name,
    createdAt: new Date(i.createdAt),
  }))

  return (
    <>
      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FactoryIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Отрасли не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/industries/new" className="flex items-center gap-2">
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
