import ClientForm from '@/components/companyAccounts/client-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import * as z from 'zod'

export const Route = createFileRoute('/clients/new')({
  component: RouteComponent,
  validateSearch: z.object({
    companyId: z.string().optional(),
  }),
})

function RouteComponent() {
  const router = useRouter()
  const { companyId } = Route.useSearch()

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
      <ClientForm initialCompanyId={companyId} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
