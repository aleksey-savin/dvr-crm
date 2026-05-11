import WishlistClientForm from '@/components/companyAccounts/wishlist-client-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import * as z from 'zod'

export const Route = createFileRoute('/wishlist/new')({
  component: RouteComponent,
  validateSearch: z.object({
    companyId: z.string().optional(),
  }),
})

function RouteComponent() {
  const router = useRouter()
  const { companyId } = Route.useSearch()

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
      title="Добавить в вишлист"
      description="Добавление компании в вишлист"
    >
      <WishlistClientForm
        initialCompanyId={companyId}
        onSuccess={handleSuccess}
      />
    </ResponsiveDialog>
  )
}
