import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/tables/data-table'
import { columns, type Company } from '@/components/tables/companies-cols'
import { db } from '@/db'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ListTodoIcon, Plus } from 'lucide-react'

const fetchCompanies = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()

  const rows = await db.query.company.findMany({
    with: {
      clients: {
        columns: { target: true, lost: true },
        with: {
          department: { columns: { name: true } },
        },
      },
      wishlistClients: { columns: { id: true } },
      revenues: { columns: { year: true, value: true } },
    },
  })

  return rows.map((row): Company => {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      regionalMarketPosition: row.regionalMarketPosition,
      industry: row.industry,
      clients: row.clients.map((c) => ({
        departmentName: c.department.name,
        target: c.target,
        lost: c.lost,
      })),
      isWishlist: row.wishlistClients.length > 0,
      revenueLastYear:
        row.revenues.find((r) => r.year === currentYear - 1)?.value ?? null,
      revenueTwoYearsAgo:
        row.revenues.find((r) => r.year === currentYear - 2)?.value ?? null,
    }
  })
})

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
