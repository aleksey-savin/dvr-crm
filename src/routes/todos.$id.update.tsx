import TodoForm from '@/components/todo-form'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { db } from '@/db'
import { todos } from '@/db/schema'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

const fetchTodo = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const todo = await db.query.todos.findFirst({
      where: eq(todos.id, data.id),
    })

    if (todo === null) throw notFound()
    return todo
  })

export const Route = createFileRoute('/todos/$id/update')({
  component: RouteComponent,
  loader: async ({ params }) => fetchTodo({ data: params }),
})

function RouteComponent() {
  const router = useRouter()

  const todo = Route.useLoaderData()
  console.log(todo)

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
      <TodoForm onSuccess={handleSuccess} item={todo} />
    </ResponsiveDialog>
  )
}
