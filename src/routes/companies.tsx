import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/companies/companies-cols'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ListTodoIcon, Plus } from 'lucide-react'
import { fetchCompanies } from '@/components/companies/actions'

export const Route = createFileRoute('/companies')({
  component: RouteComponent,
  loader: () => fetchCompanies(),
})

function RouteComponent() {
  const items = Route.useLoaderData()

  return (
    <>
      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListTodoIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет компаний</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/companies/new" className="flex items-center gap-2">
                <Plus /> Создать
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable columns={columns} data={items} />
      )}

      <Outlet />
    </>
  )
}
