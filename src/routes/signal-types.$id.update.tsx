import { createFileRoute, useRouter } from '@tanstack/react-router'

import { fetchSignalType } from '@/components/signal-types/actions'
import { SignalTypeForm } from '@/components/signal-types/signal-type-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/signal-types/$id/update')({
  loader: ({ params }) => fetchSignalType({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const type = Route.useLoaderData()

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
      title="Изменить тип сигнала"
      description="Редактирование типа сигнала"
      contentClassName="sm:max-w-lg"
    >
      <SignalTypeForm item={type} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
