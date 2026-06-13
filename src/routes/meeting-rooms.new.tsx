import { createFileRoute, useRouter } from '@tanstack/react-router'

import { MeetingRoomForm } from '@/components/meeting-rooms/meeting-room-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/meeting-rooms/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

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
      title="Новая переговорка"
      description="Создание переговорки"
      contentClassName="sm:max-w-lg"
    >
      <MeetingRoomForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
