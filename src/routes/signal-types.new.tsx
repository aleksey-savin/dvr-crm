import { createFileRoute, useRouter } from '@tanstack/react-router'

import { SignalTypeForm } from '@/components/signal-types/signal-type-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/signal-types/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/signal-types' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/signal-types' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новый тип сигнала"
      description="Создание типа сигнала"
      contentClassName="sm:max-w-lg"
    >
      <SignalTypeForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
