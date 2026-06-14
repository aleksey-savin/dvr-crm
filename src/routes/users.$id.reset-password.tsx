import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import ResetPasswordForm from '@/components/users/reset-password-form'
import { fetchUser } from '@/components/users/actions'

export const Route = createFileRoute('/users/$id/reset-password')({
  loader: ({ params }) => fetchUser({ data: params.id }),
  component: RouteComponent,
})

function RouteComponent() {
  const user = Route.useLoaderData()
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/users' })
  }

  const handleSuccess = () => {
    router.navigate({ to: '/users' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title={user.name}
      description="Сброс пароля пользователя"
    >
      <ResetPasswordForm userId={user.id} onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
