import { createFileRoute, useRouter } from '@tanstack/react-router'
import { fetchSalesPlans } from '@/components/reports/actions'
import { SalesPlanForm } from '@/components/reports/sales-plan-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/sales-plans/$id/update')({
  loader: async ({ params }) => {
    const plans = await fetchSalesPlans({ data: {} })
    const plan = plans.find((p) => p.id === params.id)
    if (!plan) throw new Error('План не найден')
    return plan
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const plan = Route.useLoaderData()

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
      title="Редактировать план"
      description="Изменение плана продаж"
    >
      <SalesPlanForm item={plan} departments={[]} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
