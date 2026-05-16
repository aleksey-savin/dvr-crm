import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchMeeting } from '@/components/meetings/actions'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/meetings/$id/update')({
  loader: ({ params }) => fetchMeeting({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const meeting = Route.useLoaderData()

  const handleClose = () => router.navigate({ to: '/meetings' })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/meetings' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Редактировать встречу"
      description="Изменение данных встречи"
      contentClassName="sm:max-w-2xl"
    >
      <MeetingForm item={meeting} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
