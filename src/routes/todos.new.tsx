import TodoForm from '@/components/todos/todo-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/todos/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  const handleClose = () => {
    router.navigate({ to: '/todos' })
  }

  const handleSuccess = () => {
    router.invalidate()
    router.navigate({ to: '/todos' })
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Новая задача"
      description="Создание новой задачи"
    >
      <TodoForm onSuccess={handleSuccess} />
    </ResponsiveDialog>
  )
}
