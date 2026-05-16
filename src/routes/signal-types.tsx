import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { RadioIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/signal-type-cols'
import { fetchSignalTypes } from '@/components/signal-types/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { SignalTypeRow } from '@/types'

export const Route = createFileRoute('/signal-types')({
  loader: () => fetchSignalTypes(),
  component: RouteComponent,
})

function RouteComponent() {
  const types = Route.useLoaderData()

  const rows: SignalTypeRow[] = types.map((t) => ({
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
              <RadioIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Типы сигналов не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/signal-types/new" className="flex items-center gap-2">
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
