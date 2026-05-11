import CompanyForm from '@/components/companies/company-form'
import { fetchCompany } from '@/components/companies/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/companies/$id/update')({
  component: RouteComponent,
  loader: async ({ params }) => fetchCompany({ data: params }),
})

function RouteComponent() {
  const router = useRouter()

  const company = Route.useLoaderData()

  const handleClose = () => {
    router.history.back()
  }

  const handleSuccess = () => {
    router.invalidate()
    router.history.back()
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Изменить компанию"
      description="Изменение компании"
    >
      <CompanyForm onSuccess={handleSuccess} item={company} />
    </ResponsiveDialog>
  )
}
