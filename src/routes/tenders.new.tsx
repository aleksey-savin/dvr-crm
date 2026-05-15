import { createFileRoute, useRouter } from '@tanstack/react-router'
import { TenderForm } from '@/components/tenders/tender-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/tenders/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => router.navigate({ to: '/tenders' })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/tenders' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => { if (!open) handleClose() }}
      title="Новый тендер"
      description="Создание нового тендера"
      contentClassName="sm:max-w-2xl"
    >
      <TenderForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
