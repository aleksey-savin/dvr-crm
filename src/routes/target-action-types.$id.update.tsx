import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchTargetActionTypes } from '@/components/target-action-types/actions'
import { TargetActionTypeForm } from '@/components/target-action-types/target-action-type-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/target-action-types/$id/update')({
  loader: async ({ params }) => {
    const types = await fetchTargetActionTypes()
    const type = types.find((t) => t.id === params.id)
    if (!type) throw new Error('Тип ЦД не найден')
    return type
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const type = Route.useLoaderData()

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
      title="Редактировать тип ЦД"
      description="Изменение типа целевого действия"
    >
      <TargetActionTypeForm item={type} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
