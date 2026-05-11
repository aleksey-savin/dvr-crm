import CompanyForm from '@/components/companies/company-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/companies/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/companies' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/companies' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новая компания"
      description="Создание новой компании"
    >
      <CompanyForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
