import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchTender } from '@/components/tenders/actions'
import { TenderForm } from '@/components/tenders/tender-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/tenders/$id/update')({
  loader: ({ params }) => fetchTender({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const tender = Route.useLoaderData()

  const handleClose = () =>
    router.navigate({ to: '/sources', search: { tab: 'tenders' } })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/sources', search: { tab: 'tenders' } })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Редактировать тендер"
      description="Изменение данных тендера"
      contentClassName="sm:max-w-2xl"
    >
      <TenderForm item={tender} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
