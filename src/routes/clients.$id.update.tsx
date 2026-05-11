import ClientForm from '@/components/companyAccounts/client-form'
import { fetchClient } from '@/components/companyAccounts/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/clients/$id/update')({
  component: RouteComponent,
  loader: async ({ params }) => fetchClient({ data: params }),
})

function RouteComponent() {
  const router = useRouter()

  const client = Route.useLoaderData()

  const handleClose = () => {
    router.history.back()
  }

  const handleSuccess = () => {
    router.invalidate()
    router.history.back()
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить клиента"
      description="Изменение клиента"
    >
      <ClientForm onSuccess={handleSuccess} item={client} />
    </ResponsiveDialog>
  )
}
