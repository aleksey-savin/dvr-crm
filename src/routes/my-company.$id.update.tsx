import DepartmentForm from '@/components/department-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { db } from '@/db'
import { department } from '@/db/schema'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

const fetchDepartment = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const task = await db.query.department.findFirst({
      where: eq(department.id, data.id),
    })

    if (!task) throw notFound()
    return task
  })

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
