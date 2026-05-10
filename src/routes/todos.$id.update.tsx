import TodoForm from '@/components/todo-form'
import { fetchTodo } from '@/components/todos/actions'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/todos/$id/update')({
  component: RouteComponent,
  loader: async ({ params }) => fetchTodo({ data: params }),
})

function RouteComponent() {
  const router = useRouter()

  const todo = Route.useLoaderData()

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
      title="Изменить задачу"
      description="Изменение задачи"
    >
      <TodoForm onSuccess={handleSuccess} item={todo} />
    </ResponsiveDialog>
  )
}
