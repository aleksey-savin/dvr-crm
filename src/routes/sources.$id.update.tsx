import { createFileRoute, useRouter } from '@tanstack/react-router'

import { fetchSource } from '@/components/sources/actions'
import { SourceForm } from '@/components/sources/source-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/sources/$id/update')({
  loader: ({ params }) => fetchSource({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const source = Route.useLoaderData()

  const handleClose = () => {
    router.navigate({ to: '/sources' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/sources' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить источник"
      description="Редактирование источника"
      contentClassName="sm:max-w-lg"
    >
      <SourceForm item={source} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
