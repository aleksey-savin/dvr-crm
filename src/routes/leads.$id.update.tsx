import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchLead } from '@/components/leads/actions'
import { LeadForm } from '@/components/leads/lead-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/leads/$id/update')({
  loader: ({ params }) => fetchLead({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const lead = Route.useLoaderData()

  const handleClose = () => router.navigate({ to: '/leads' })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/leads' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => { if (!open) handleClose() }}
      title="Редактировать лид"
      description="Изменение данных лида"
      contentClassName="sm:max-w-2xl"
    >
      <LeadForm item={lead} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
