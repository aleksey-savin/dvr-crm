import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/wishlist-cols'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ListIcon, Plus } from 'lucide-react'
import { fetchWishlistAccounts } from '@/components/accounts/actions'

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
