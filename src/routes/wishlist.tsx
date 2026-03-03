import { db } from '@/db'
import { comment } from '@/db/schema'
import { DataTable } from '@/components/tables/data-table'
import { columns, type WishlistClient } from '@/components/tables/wishlist-cols'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { ListIcon, Plus } from 'lucide-react'

const fetchWishlistClients = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()

  const [rows, commentCounts] = await Promise.all([
    db.query.wishlistClient.findMany({
      with: {
        company: {
          columns: { id: true, name: true, regionalMarketPosition: true },
          with: {
            revenues: { columns: { year: true, value: true } },
          },
        },
        departments: {
          with: {
            department: { columns: { name: true } },
          },
        },
        hooks: { columns: { description: true } },
        todos: { columns: { id: true, name: true, status: true } },
        responsibleUsers: {
          with: {
            user: { columns: { name: true } },
          },
        },
      },
    }),
    db
      .select({
        entityId: comment.entityId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(comment)
      .where(eq(comment.entityType, 'wishlistClient'))
      .groupBy(comment.entityId),
  ])

  const countMap = new Map(commentCounts.map((c) => [c.entityId, c.count]))

  return rows.map(
    (row): WishlistClient => ({
      id: row.id,
      companyId: row.companyId,
      companyName: row.company.name,
      departments: row.departments.map((d) => d.department.name),
      industry: row.industry,
      regionalMarketPosition: row.company.regionalMarketPosition,
      revenueLastYear:
        row.company.revenues.find((r) => r.year === currentYear - 1)?.value ??
        null,
      revenueTwoYearsAgo:
        row.company.revenues.find((r) => r.year === currentYear - 2)?.value ??
        null,
      why: row.why,
      hooks: row.hooks.map((h) => h.description),
      todos: row.todos.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status as WishlistClient['todos'][number]['status'],
      })),
      commentsCount: countMap.get(row.id) ?? 0,
      responsibles: row.responsibleUsers.map((r) => r.user.name),
    }),
  )
})

export const Route = createFileRoute('/wishlist')({
  component: RouteComponent,
  loader: () => fetchWishlistClients(),
})

function RouteComponent() {
  const items = Route.useLoaderData()

  return (
    <>
      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Нет клиентов в вишлисте</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/wishlist/new" className="flex items-center gap-2">
                <Plus /> Добавить
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
