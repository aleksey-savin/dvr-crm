import { createFileRoute, useRouter } from '@tanstack/react-router'

import { SourceForm } from '@/components/sources/source-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/sources/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

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
      title="Новый источник"
      description="Создание источника"
      contentClassName="sm:max-w-lg"
    >
      <SourceForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
