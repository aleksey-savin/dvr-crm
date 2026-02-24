import ClientForm from '@/components/client-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/clients/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/clients' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/clients' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новый клиент"
      description="Добавление нового клиента"
    >
      <ClientForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
