import { createFileRoute, useRouter } from '@tanstack/react-router'
import { TargetActionTypeForm } from '@/components/target-action-types/target-action-type-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/target-action-types/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => router.navigate({ to: '/target-action-types' })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/target-action-types' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новый тип ЦД"
      description="Создание нового типа целевого действия"
    >
      <TargetActionTypeForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
