import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ContactRoleForm } from '@/components/contact-roles/contact-role-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/contact-roles/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/contact-roles' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/contact-roles' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новая роль контакта"
      description="Создание роли контакта"
      contentClassName="sm:max-w-lg"
    >
      <ContactRoleForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
