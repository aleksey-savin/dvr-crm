import { createFileRoute, useRouter } from '@tanstack/react-router'
import { SignalForm } from '@/components/signals/signal-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/signals/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () =>
    router.navigate({ to: '/sources', search: { tab: 'signals' } })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/sources', search: { tab: 'signals' } })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новый сигнал"
      description="Создание нового сигнала"
      contentClassName="sm:max-w-2xl"
    >
      <SignalForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
