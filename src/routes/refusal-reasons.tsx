import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { XCircleIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/refusal-reason-cols'
import { fetchRefusalReasons } from '@/components/refusal-reasons/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { RefusalReasonRow } from '@/types'

export const Route = createFileRoute('/refusal-reasons')({
  loader: () => fetchRefusalReasons(),
  component: RouteComponent,
})

function RouteComponent() {
  const reasons = Route.useLoaderData()

  const rows: RefusalReasonRow[] = reasons.map((r) => ({
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
              <XCircleIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Причины отказа не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/refusal-reasons/new" className="flex items-center gap-2">
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
