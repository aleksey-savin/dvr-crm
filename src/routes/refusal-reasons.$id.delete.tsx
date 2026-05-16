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
import { deleteRefusalReason, fetchRefusalReason } from '@/components/refusal-reasons/actions'

export const Route = createFileRoute('/refusal-reasons/$id/delete')({
  loader: ({ params }) => fetchRefusalReason({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const reason = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/refusal-reasons' })
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteRefusalReason({ data: reason.id })
      toast.success('Причина отказа удалена')
      router.invalidate()
      router.navigate({ to: '/refusal-reasons' })
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
          <AlertDialogTitle>Удалить причину отказа?</AlertDialogTitle>
          <AlertDialogDescription>
            Причина «{reason.name}» будет удалена. У лидов и тендеров с этой
            причиной значение будет очищено.
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
