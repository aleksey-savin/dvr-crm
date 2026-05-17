import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchSignal } from '@/components/signals/actions'
import { SignalForm } from '@/components/signals/signal-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/signals/$id/update')({
  loader: ({ params }) => fetchSignal({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const signal = Route.useLoaderData()

  const handleClose = () => router.navigate({ to: '/signals' })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/signals' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => { if (!open) handleClose() }}
      title="Редактировать сигнал"
      description="Изменение данных сигнала"
      contentClassName="sm:max-w-2xl"
    >
      <SignalForm item={signal} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
