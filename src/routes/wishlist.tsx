import { db } from '@/db'
import { companyAccount, comment } from '@/db/schema'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/wishlist-cols'
import type { WishlistAccountRow } from '@/types'
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

const fetchWishlistAccounts = createServerFn().handler(async () => {
  const currentYear = new Date().getFullYear()

  const [rows, commentCounts] = await Promise.all([
    db.query.companyAccount.findMany({
      where: eq(companyAccount.accountType, 'wishlist'),
      with: {
        company: {
          columns: {
            id: true,
            name: true,
            regionalMarketPosition: true,
            industry: true,
          },
          with: {
            revenues: { columns: { year: true, value: true } },
          },
        },
        businessUnit: { columns: { name: true } },
        hooks: { columns: { description: true } },
        todos: { columns: { id: true, name: true, status: true } },
        owner: { columns: { name: true } },
      },
      orderBy: (a, { asc }) => [asc(a.position)],
    }),
    db
      .select({
        entityId: comment.entityId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(comment)
      .where(eq(comment.entityType, 'companyAccount'))
      .groupBy(comment.entityId),
  ])

  const countMap = new Map(commentCounts.map((c) => [c.entityId, c.count]))

  return rows.map(
    (row): WishlistAccountRow => ({
      id: row.id,
      companyId: row.companyId,
      companyName: row.company.name,
      businessUnit: row.businessUnit.name,
      industry: row.company.industry,
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
        status: t.status as WishlistAccountRow['todos'][number]['status'],
      })),
      commentsCount: countMap.get(row.id) ?? 0,
      responsible: row.owner?.name ?? null,
      wishlistState:
        (row.wishlistState as WishlistAccountRow['wishlistState']) ?? null,
      position: row.position,
    }),
  )
})

export const Route = createFileRoute('/wishlist')({
  component: RouteComponent,
  loader: () => fetchWishlistAccounts(),
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
