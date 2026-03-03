import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/wishlist/$id/update')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.history.back()
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Редактировать клиента вишлиста"
    >
      <div className="text-muted-foreground text-sm">Скоро будет готово</div>
    </ResponsiveDialog>
  )
}
