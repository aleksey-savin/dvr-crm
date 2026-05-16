import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { TagIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/contact-role-cols'
import { fetchContactRoles } from '@/components/contact-roles/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { ContactRoleRow } from '@/types'

export const Route = createFileRoute('/contact-roles')({
  loader: () => fetchContactRoles(),
  component: RouteComponent,
})

function RouteComponent() {
  const roles = Route.useLoaderData()

  const rows: ContactRoleRow[] = roles.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: new Date(r.createdAt),
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
          <EmptyDescription>Роли контактов не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/contact-roles/new" className="flex items-center gap-2">
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
