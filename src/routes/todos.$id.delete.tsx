import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { todos } from '@/db/schema'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const fetchTodo = createServerFn()
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return db.query.todos.findFirst({ where: eq(todos.id, id) })
  })

const deleteTodo = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(todos).where(eq(todos.id, id))
  })

export const Route = createFileRoute('/todos/$id/delete')({
  loader: ({ params }) => fetchTodo({ data: params.id }),
  component: RouteComponent,
})

function RouteComponent() {
  const todo = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/todos' })
  }

  const handleConfirm = async () => {
    if (!todo) return
    setIsLoading(true)
    try {
      await deleteTodo({ data: todo.id })
      toast.success('Задача удалена')
      router.invalidate()
      router.navigate({ to: '/todos' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
          <AlertDialogDescription>
            Задача «{todo?.name}» будет удалена без возможности восстановления.
            Это действие необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
