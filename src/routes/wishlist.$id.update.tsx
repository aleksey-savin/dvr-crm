import { createFileRoute, useRouter } from '@tanstack/react-router'
import WishlistClientForm from '@/components/companyAccounts/wishlist-client-form'
import { fetchWishlistClient } from '@/components/companyAccounts/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/wishlist/$id/update')({
  loader: ({ params }) => fetchWishlistClient({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()

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
      title="Редактировать клиента вишлиста"
      contentClassName="h-[85dvh]"
    >
      <WishlistClientForm item={item} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
