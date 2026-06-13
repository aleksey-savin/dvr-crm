import { createFileRoute, useRouter } from '@tanstack/react-router'
import { SalesPlanForm } from '@/components/reports/sales-plan-form'
import { fetchSalesPlanDepartments } from '@/components/reports/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/sales-plans/new')({
  loader: () => fetchSalesPlanDepartments(),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const departments = Route.useLoaderData()

  const handleClose = () => router.navigate({ to: '/sales-plans' })

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/sales-plans' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новый план продаж"
      description="План по менеджеру и сегменту на год"
    >
      <SalesPlanForm departments={departments} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
