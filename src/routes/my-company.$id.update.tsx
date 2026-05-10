import DepartmentForm from '@/components/department-form'
import { fetchDepartment } from '@/components/departments/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/my-company/$id/update')({
  component: RouteComponent,
  loader: async ({ params }) => fetchDepartment({ data: params }),
})

function RouteComponent() {
  const router = useRouter()

  const departmentItem = Route.useLoaderData()

  const handleClose = () => {
    router.navigate({ to: '/my-company', search: { tab: 'structure' } })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/my-company', search: { tab: 'structure' } })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить подразделение"
      description="Изменение подразделение"
    >
      <DepartmentForm onSuccess={handleSuccess} item={departmentItem} />
    </ResponsiveDialog>
  )
}
