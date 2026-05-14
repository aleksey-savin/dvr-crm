import { createFileRoute, useRouter } from '@tanstack/react-router'

import { fetchIndustry } from '@/components/industries/actions'
import { IndustryForm } from '@/components/industries/industry-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/industries/$id/update')({
  loader: ({ params }) => fetchIndustry({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const industry = Route.useLoaderData()

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
      title="Изменить отрасль"
      description="Редактирование отрасли"
      contentClassName="sm:max-w-lg"
    >
      <IndustryForm item={industry} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
