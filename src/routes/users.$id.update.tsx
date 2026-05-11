import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import UserForm from '@/components/users/user-form'
import { fetchUser } from '@/components/users/actions'

export const Route = createFileRoute('/users/$id/update')({
  loader: ({ params }) =>
    fetchUser({
      data: params.id,
    }),
  component: RouteComponent,
})

function RouteComponent() {
  const user = Route.useLoaderData()
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/users' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/users' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title={user.name}
      description="Редактирование параметров пользователя"
    >
      <UserForm
        user={user}
        departmentId={user.departmentId ?? undefined}
        onSuccess={handleSuccess}
      />
    </ResponsiveDialog>
  )
}
