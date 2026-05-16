import { createFileRoute, useRouter } from '@tanstack/react-router'

import { fetchContactRole } from '@/components/contact-roles/actions'
import { ContactRoleForm } from '@/components/contact-roles/contact-role-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

export const Route = createFileRoute('/contact-roles/$id/update')({
  loader: ({ params }) => fetchContactRole({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const role = Route.useLoaderData()

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
      title="Изменить роль"
      description="Редактирование роли контакта"
      contentClassName="sm:max-w-lg"
    >
      <ContactRoleForm item={role} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
