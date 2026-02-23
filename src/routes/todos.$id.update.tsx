import TodoForm from '@/components/todo-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { db } from '@/db'
import { todo } from '@/db/schema'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

const fetchTodo = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const task = await db.query.todo.findFirst({
      where: eq(todo.id, data.id),
    })

    if (task === null) throw notFound()
    return task
  })

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
      title="Новая задача"
      description="Создание новой задачи"
    >
      <TodoForm onSuccess={handleSuccess} item={todo} />
    </ResponsiveDialog>
  )
}
