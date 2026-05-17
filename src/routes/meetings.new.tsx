import { createFileRoute, useRouter } from '@tanstack/react-router'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/meetings/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

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
      title="Новая встреча"
      description="Создание новой встречи"
      contentClassName="sm:max-w-2xl"
    >
      <MeetingForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
