import { createFileRoute, useRouter } from '@tanstack/react-router'

import { IndustryForm } from '@/components/industries/industry-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/industries/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/industries' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/industries' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новая отрасль"
      description="Создание новой отрасли"
      contentClassName="sm:max-w-lg"
    >
      <IndustryForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
