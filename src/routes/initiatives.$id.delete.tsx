import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
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
  fetchInitiative,
  softDeleteInitiative,
} from '@/components/initiatives/actions'

export const Route = createFileRoute('/initiatives/$id/delete')({
  loader: ({ params }) => fetchInitiative({ data: { id: params.id } }),
  component: RouteComponent,
})

function RouteComponent() {
  const item = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => router.navigate({ to: '/initiatives' })

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await softDeleteInitiative({ data: { id: item.id } })
      toast.success('Инициатива удалена')
      router.invalidate()
      router.navigate({ to: '/initiatives' })
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
          <AlertDialogTitle>Удалить инициативу?</AlertDialogTitle>
          <AlertDialogDescription>
            Инициатива «{item.title}» будет удалена. Действие необратимо.
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
