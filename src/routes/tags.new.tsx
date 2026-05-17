import { createFileRoute, useRouter } from '@tanstack/react-router'

import { TagForm } from '@/components/tags/tag-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/tags/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

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
      title="Новый тег"
      description="Создание тега"
      contentClassName="sm:max-w-lg"
    >
      <TagForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
