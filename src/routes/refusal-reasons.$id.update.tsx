import { createFileRoute, useRouter } from '@tanstack/react-router'

import { fetchRefusalReason } from '@/components/refusal-reasons/actions'
import { RefusalReasonForm } from '@/components/refusal-reasons/refusal-reason-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/refusal-reasons/$id/update')({
  loader: ({ params }) => fetchRefusalReason({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const reason = Route.useLoaderData()

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
      title="Изменить причину отказа"
      description="Редактирование причины отказа"
      contentClassName="sm:max-w-lg"
    >
      <RefusalReasonForm item={reason} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
