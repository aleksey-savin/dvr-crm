import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
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
import {
  fetchTargetActionTypes,
  softDeleteTargetActionType,
} from '@/components/target-action-types/actions'

export const Route = createFileRoute('/target-action-types/$id/delete')({
  loader: async ({ params }) => {
    const types = await fetchTargetActionTypes()
    const type = types.find((t) => t.id === params.id)
    if (!type) throw new Error('Тип ЦД не найден')
    return type
  },
  component: RouteComponent,
})

function RouteComponent() {
  const type = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => router.navigate({ to: '/target-action-types' })

  const handleConfirm = async () => {
    if (type.isSystem) {
      toast.error('Системные типы нельзя удалить')
      return
    }
    setIsLoading(true)
    try {
      await softDeleteTargetActionType({ data: { id: type.id } })
      toast.success('Тип ЦД удалён')
      router.invalidate()
      router.navigate({ to: '/target-action-types' })
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
          <AlertDialogTitle>Удалить тип ЦД?</AlertDialogTitle>
          <AlertDialogDescription>
            Тип «{type.name}» будет удалён. Это действие необратимо.
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
              void handleConfirm()
            }}
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
