import { ensureCanManageChangelog } from '@/components/changelog/actions'
import { ChangelogForm } from '@/components/changelog/changelog-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/changelog/new')({
  component: RouteComponent,
  loader: () => ensureCanManageChangelog(),
})

function RouteComponent() {
  const router = useRouter()

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
      title="Новый релиз"
      description="Создание записи changelog"
    >
      <ChangelogForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
