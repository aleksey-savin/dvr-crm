import { createFileRoute, useRouter } from '@tanstack/react-router'

import { fetchMeetingRoom } from '@/components/meeting-rooms/actions'
import { MeetingRoomForm } from '@/components/meeting-rooms/meeting-room-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/meeting-rooms/$id/update')({
  loader: ({ params }) => fetchMeetingRoom({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const room = Route.useLoaderData()

  const handleClose = () => {
    router.navigate({ to: '/meeting-rooms' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/meeting-rooms' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить переговорку"
      description="Редактирование переговорки"
      contentClassName="sm:max-w-lg"
    >
      <MeetingRoomForm item={room} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
