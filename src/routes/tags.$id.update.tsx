import { createFileRoute, useRouter } from '@tanstack/react-router'

import { fetchTag } from '@/components/tags/actions'
import { TagForm } from '@/components/tags/tag-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/tags/$id/update')({
  loader: ({ params }) => fetchTag({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const tag = Route.useLoaderData()

  const handleClose = () => {
    router.navigate({ to: '/tags' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/tags' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить тег"
      description="Редактирование тега"
      contentClassName="sm:max-w-lg"
    >
      <TagForm item={tag} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
