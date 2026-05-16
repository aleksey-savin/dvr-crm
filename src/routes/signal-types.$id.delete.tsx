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
import { deleteSignalType, fetchSignalType } from '@/components/signal-types/actions'

export const Route = createFileRoute('/signal-types/$id/delete')({
  loader: ({ params }) => fetchSignalType({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const type = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/signal-types' })
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteSignalType({ data: type.id })
      toast.success('Тип сигнала удалён')
      router.invalidate()
      router.navigate({ to: '/signal-types' })
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
          <AlertDialogTitle>Удалить тип сигнала?</AlertDialogTitle>
          <AlertDialogDescription>
            Тип «{type.name}» будет удалён. У сигналов с этим типом значение
            будет очищено.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={handleClose}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault()
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
