import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LeadForm } from '@/components/leads/lead-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/leads/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => router.navigate({ to: '/leads' })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/leads' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => { if (!open) handleClose() }}
      title="Новый лид"
      description="Создание нового лида"
      contentClassName="sm:max-w-2xl"
    >
      <LeadForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
