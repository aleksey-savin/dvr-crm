import { fetchChangelogRelease } from '@/components/changelog/actions'
import { ChangelogForm } from '@/components/changelog/changelog-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/changelog/$id/update')({
  component: RouteComponent,
  loader: ({ params }) => fetchChangelogRelease({ data: params }),
})

function RouteComponent() {
  const router = useRouter()
  const release = Route.useLoaderData()

  const handleClose = () => {
    router.navigate({ to: '/changelog' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/changelog' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить релиз"
      description="Редактирование записи changelog"
    >
      <ChangelogForm item={release} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
