import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { DoorOpenIcon, PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/tables/data-table'
import { columns } from '@/components/tables/meeting-room-cols'
import { fetchMeetingRooms } from '@/components/meeting-rooms/actions'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty'
import type { MeetingRoomRow } from '@/types'

export const Route = createFileRoute('/meeting-rooms')({
  loader: () => fetchMeetingRooms(),
  component: RouteComponent,
})

function RouteComponent() {
  const rooms = Route.useLoaderData()

  const rows: MeetingRoomRow[] = rooms.map((r) => ({
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
              <DoorOpenIcon />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyDescription>Переговорки не добавлены</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link to="/meeting-rooms/new" className="flex items-center gap-2">
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
