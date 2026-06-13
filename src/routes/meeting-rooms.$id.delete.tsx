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
  deleteMeetingRoom,
  fetchMeetingRoom,
} from '@/components/meeting-rooms/actions'

export const Route = createFileRoute('/meeting-rooms/$id/delete')({
  loader: ({ params }) => fetchMeetingRoom({ data: params }),
  component: RouteComponent,
})

function RouteComponent() {
  const room = Route.useLoaderData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    router.navigate({ to: '/meeting-rooms' })
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await deleteMeetingRoom({ data: room.id })
      toast.success('Переговорка удалена')
      router.invalidate()
      router.navigate({ to: '/meeting-rooms' })
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
          <AlertDialogTitle>Удалить переговорку?</AlertDialogTitle>
          <AlertDialogDescription>
            Переговорка «{room.name}» будет удалена. У встреч, забронировавших
            её, бронь будет снята.
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
