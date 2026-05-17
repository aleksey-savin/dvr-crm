import { createFileRoute, useRouter } from '@tanstack/react-router'

import { RefusalReasonForm } from '@/components/refusal-reasons/refusal-reason-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/refusal-reasons/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/refusal-reasons' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/refusal-reasons' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новая причина отказа"
      description="Создание причины отказа"
      contentClassName="sm:max-w-lg"
    >
      <RefusalReasonForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
