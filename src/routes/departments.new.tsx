import DepartmentForm from '@/components/department-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/departments/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/departments' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/departments' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новый бизнес-юнит"
      description="Создание нового бизнес-юнита"
    >
      <DepartmentForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
